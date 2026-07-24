<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Utils\Response;
use App\Utils\Validator;

class NutricionController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    // RECETAS
    public function getRecetas()
    {
        $recetas = $this->db->query(
            "SELECT * FROM recetas ORDER BY nombre"
        )->fetchAll();

        return Response::success($recetas);
    }

    public function getReceta($id)
    {
        $receta = $this->db->query(
            "SELECT * FROM recetas WHERE id = ?",
            [$id]
        )->fetch();

        if (!$receta) {
            return Response::error('Receta no encontrada', 404);
        }

        return Response::success($receta);
    }

    // HISTORIAL DE COMIDAS
    public function getHistorialComidas($pacienteId)
    {
        $historial = $this->db->query(
            "SELECT rc.*, tc.nombre as tipo_nombre
             FROM registro_comidas rc
             LEFT JOIN tipos_comida tc ON rc.tipo_comida_id = tc.id
             WHERE rc.paciente_id = ?
             ORDER BY rc.fecha DESC, rc.created_at DESC
             LIMIT 50",
            [$pacienteId]
        )->fetchAll();

        // Formatear para frontend
        $formateados = array_map(function($c) {
            return [
                'id' => $c['id'],
                'tipo_comida' => $c['tipo_nombre'] ?? 'comida',
                'descripcion' => $c['descripcion'],
                'foto' => $c['foto_url'],
                'created_at' => $c['fecha'] . ' ' . ($c['hora'] ?? '12:00:00')
            ];
        }, $historial);

        return Response::success($formateados);
    }

    public function registrarComida($data)
    {
        $pacienteId = $data['paciente_id'] ?? null;
        $descripcion = $data['descripcion'] ?? '';
        $tipoComida = $data['tipo_comida'] ?? 'comida';

        if (!$pacienteId || !$descripcion) {
            return Response::error('paciente_id y descripcion son requeridos', 422);
        }

        // Mapear tipo de comida a tipo_comida_id
        $tiposMap = [
            'desayuno' => 1,
            'colacion_am' => 2,
            'comida' => 3,
            'colacion_pm' => 4,
            'cena' => 5
        ];
        $tipoId = $tiposMap[$tipoComida] ?? 3;

        // Manejar foto si existe
        $fotoUrl = null;
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../public/uploads/comidas/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileName = uniqid() . '_' . basename($_FILES['foto']['name']);
            $filePath = $uploadDir . $fileName;
            if (move_uploaded_file($_FILES['foto']['tmp_name'], $filePath)) {
                $fotoUrl = '/uploads/comidas/' . $fileName;
            }
        }

        $this->db->query(
            "INSERT INTO registro_comidas (paciente_id, tipo_comida_id, descripcion, foto_url, fecha, hora, created_at)
             VALUES (?, ?, ?, ?, CURDATE(), CURTIME(), NOW())",
            [$pacienteId, $tipoId, $descripcion, $fotoUrl]
        );

        return Response::success(null, 'Comida registrada exitosamente', 201);
    }

    // CHECKLIST DIARIO
    public function getChecklistDiario($pacienteId, $fecha)
    {
        $checklist = $this->db->query(
            "SELECT * FROM checklist_comidas
             WHERE paciente_id = ? AND fecha = ?",
            [$pacienteId, $fecha]
        )->fetch();

        // Construir items desde columnas o usar defaults
        $items = [
            ['id' => 1, 'nombre' => 'Desayuno completo', 'completado' => $checklist ? (bool)($checklist['desayuno'] ?? false) : false],
            ['id' => 2, 'nombre' => 'Colación matutina', 'completado' => $checklist ? (bool)($checklist['colacion_matutina'] ?? false) : false],
            ['id' => 3, 'nombre' => 'Comida principal', 'completado' => $checklist ? (bool)($checklist['comida'] ?? false) : false],
            ['id' => 4, 'nombre' => 'Colación vespertina', 'completado' => $checklist ? (bool)($checklist['colacion_vespertina'] ?? false) : false],
            ['id' => 5, 'nombre' => 'Cena ligera', 'completado' => $checklist ? (bool)($checklist['cena'] ?? false) : false]
        ];

        return Response::success($items);
    }

    public function actualizarChecklist($data)
    {
        $pacienteId = $data['paciente_id'] ?? null;
        $fecha = $data['fecha'] ?? date('Y-m-d');
        $items = $data['items'] ?? [];

        if (!$pacienteId) {
            return Response::error('paciente_id es requerido', 422);
        }

        // Mapear items array a columnas (solo las que existen en la tabla)
        $columnMap = [
            1 => 'desayuno',
            2 => 'colacion_matutina',
            3 => 'comida',
            4 => 'colacion_vespertina',
            5 => 'cena'
        ];

        $columns = [];
        foreach ($items as $item) {
            $id = $item['id'] ?? null;
            $completado = $item['completado'] ?? false;
            if ($id && isset($columnMap[$id])) {
                $columns[$columnMap[$id]] = $completado ? 1 : 0;
            }
        }

        // Verificar si ya existe un registro para hoy
        $existing = $this->db->query(
            "SELECT id FROM checklist_comidas WHERE paciente_id = ? AND fecha = ?",
            [$pacienteId, $fecha]
        )->fetch();

        if ($existing) {
            $sets = [];
            $values = [];
            foreach ($columns as $col => $val) {
                $sets[] = "$col = ?";
                $values[] = $val;
            }
            $sets[] = "updated_at = NOW()";
            $values[] = $existing['id'];

            $this->db->query(
                "UPDATE checklist_comidas SET " . implode(', ', $sets) . " WHERE id = ?",
                $values
            );
        } else {
            $cols = array_keys($columns);
            $vals = array_values($columns);
            $placeholders = array_fill(0, count($cols), '?');

            $this->db->query(
                "INSERT INTO checklist_comidas (paciente_id, fecha, " . implode(', ', $cols) . ", created_at)
                 VALUES (?, ?, " . implode(', ', $placeholders) . ", NOW())",
                array_merge([$pacienteId, $fecha], $vals)
            );
        }

        return Response::success(null, 'Checklist actualizado exitosamente');
    }

    // RESUMEN DEL DÍA - Actualizado con la tabla alimentos_opciones
    public function getResumenDia($pacienteId, $fecha)
    {
        // Obtener comidas del día agrupadas por tipo usando alimentos_opciones
        $comidas = $this->db->query(
            "SELECT rc.*, tc.nombre as tipo_nombre, a.nombre as alimento_nombre,
                    a.kcal as calorias, a.hidratos_de_carbono as carbohidratos, a.proteinas, a.lipidos as grasas
             FROM registro_comidas rc
             LEFT JOIN tipos_comida tc ON rc.tipo_comida_id = tc.id
             LEFT JOIN alimentos_opciones a ON rc.alimento_id = a.id
             WHERE rc.paciente_id = ? AND rc.fecha = ?
             ORDER BY rc.tipo_comida_id, rc.hora",
            [$pacienteId, $fecha]
        )->fetchAll();

        // Calcular totales de macros
        $totales = [
            'calorias' => 0,
            'carbohidratos' => 0,
            'proteinas' => 0,
            'grasas' => 0
        ];

        // Organizar comidas por tipo
        $comidasPorTipo = [
            'desayuno' => ['items' => [], 'calorias' => 0, 'objetivo' => 450],
            'almuerzo' => ['items' => [], 'calorias' => 0, 'objetivo' => 550],
            'cena' => ['items' => [], 'calorias' => 0, 'objetivo' => 450],
            'snacks' => ['items' => [], 'calorias' => 0, 'objetivo' => 200]
        ];

        $tipoMap = [
            1 => 'desayuno',
            2 => 'snacks',  // colacion_am
            3 => 'almuerzo',
            4 => 'snacks',  // colacion_pm
            5 => 'cena'
        ];

        foreach ($comidas as $c) {
            $tipo = $tipoMap[$c['tipo_comida_id']] ?? 'snacks';
            $calorias = (int)($c['calorias'] ?? 0);

            $comidasPorTipo[$tipo]['items'][] = [
                'id' => $c['id'],
                'nombre' => $c['alimento_nombre'] ?? $c['descripcion'],
                'calorias' => $calorias,
                'carbohidratos' => (int)($c['carbohidratos'] ?? 0),
                'proteinas' => (int)($c['proteinas'] ?? 0),
                'grasas' => (int)($c['grasas'] ?? 0)
            ];

            $comidasPorTipo[$tipo]['calorias'] += $calorias;

            $totales['calorias'] += $calorias;
            $totales['carbohidratos'] += (int)($c['carbohidratos'] ?? 0);
            $totales['proteinas'] += (int)($c['proteinas'] ?? 0);
            $totales['grasas'] += (int)($c['grasas'] ?? 0);
        }

        // Obtener objetivos del paciente (usar defaults si no existen)
        $objetivos = $this->db->query(
            "SELECT * FROM objetivos_nutricion WHERE paciente_id = ?",
            [$pacienteId]
        )->fetch();

        $objetivoCalorias = $objetivos['calorias'] ?? 1800;
        $objetivoCarbos = $objetivos['carbohidratos'] ?? 167;
        $objetivoProteinas = $objetivos['proteinas'] ?? 93;
        $objetivoGrasas = $objetivos['grasas'] ?? 49;

        // Obtener registro de agua
        $agua = $this->getAguaDelDia($pacienteId, $fecha);

        return Response::success([
            'macros' => [
                'calorias' => ['consumidas' => $totales['calorias'], 'objetivo' => $objetivoCalorias],
                'carbohidratos' => ['consumidas' => $totales['carbohidratos'], 'objetivo' => $objetivoCarbos],
                'proteinas' => ['consumidas' => $totales['proteinas'], 'objetivo' => $objetivoProteinas],
                'grasas' => ['consumidas' => $totales['grasas'], 'objetivo' => $objetivoGrasas]
            ],
            'comidas' => $comidasPorTipo,
            'agua' => $agua
        ]);
    }

    // REGISTRO DE AGUA
    private function getAguaDelDia($pacienteId, $fecha)
    {
        $registro = $this->db->query(
            "SELECT * FROM registro_agua WHERE paciente_id = ? AND fecha = ?",
            [$pacienteId, $fecha]
        )->fetch();

        if ($registro) {
            $vasosLlenos = (int)$registro['vasos'];
            $vasos = array_fill(0, $vasosLlenos, true);
            while (count($vasos) < 8) {
                $vasos[] = false;
            }

            return [
                'consumida' => (float)$registro['cantidad'],
                'objetivo' => 2.0,
                'vasos' => $vasos
            ];
        }

        return [
            'consumida' => 0,
            'objetivo' => 2.0,
            'vasos' => array_fill(0, 8, false)
        ];
    }

    public function getRegistroAgua($pacienteId, $fecha)
    {
        $agua = $this->getAguaDelDia($pacienteId, $fecha);
        return Response::success($agua);
    }

    public function registrarAgua($data)
    {
        $pacienteId = $data['paciente_id'] ?? null;
        $fecha = $data['fecha'] ?? date('Y-m-d');
        $cantidad = $data['cantidad'] ?? 0;

        if (!$pacienteId) {
            return Response::error('paciente_id es requerido', 422);
        }

        $vasos = (int)($cantidad / 0.25);

        // Verificar si ya existe registro
        $existing = $this->db->query(
            "SELECT id FROM registro_agua WHERE paciente_id = ? AND fecha = ?",
            [$pacienteId, $fecha]
        )->fetch();

        if ($existing) {
            $this->db->query(
                "UPDATE registro_agua SET cantidad = ?, vasos = ?, updated_at = NOW() WHERE id = ?",
                [$cantidad, $vasos, $existing['id']]
            );
        } else {
            $this->db->query(
                "INSERT INTO registro_agua (paciente_id, fecha, cantidad, vasos, created_at)
                 VALUES (?, ?, ?, ?, NOW())",
                [$pacienteId, $fecha, $cantidad, $vasos]
            );
        }

        return Response::success(null, 'Registro de agua actualizado');
    }

    public function obtenerPlanPaciente($id) 
    {
        try {
            $plan = $this->db->query(
                "SELECT * FROM paciente_porciones_diarias WHERE paciente_id = ? ORDER BY fecha_asignacion DESC LIMIT 1",
                [$id]
            )->fetch();

            return Response::success($plan ? $plan : null);
        } catch (\Exception $e) {
            return Response::error('Error al obtener el plan: ' . $e->getMessage(), 500);
        }
    }

    // ALIMENTOS
    public function registrarAlimento($data)
    {
        $pacienteId = $data['paciente_id'] ?? null;
        $tipoComida = $data['tipo_comida'] ?? 'snacks';
        $alimentoNombre = $data['alimento_nombre'] ?? $data['descripcion'] ?? '';
        $calorias = $data['calorias'] ?? 0;
        $carbohidratos = $data['carbohidratos'] ?? 0;
        $proteinas = $data['proteinas'] ?? 0;
        $grasas = $data['grasas'] ?? 0;
        $fecha = $data['fecha'] ?? date('Y-m-d');

        if (!$pacienteId) {
            return Response::error('paciente_id es requerido', 422);
        }

        $tiposMap = [
            'desayuno' => 1,
            'snacks' => 2,
            'almuerzo' => 3,
            'cena' => 5
        ];
        $tipoId = $tiposMap[$tipoComida] ?? 2;

        try {
            $this->db->query(
                "INSERT INTO registro_comidas (paciente_id, tipo_comida_id, descripcion, calorias, carbohidratos, proteinas, grasas, fecha, hora, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURTIME(), NOW())",
                [$pacienteId, $tipoId, $alimentoNombre, $calorias, $carbohidratos, $proteinas, $grasas, $fecha]
            );
        } catch (\Exception $e) {
            $this->db->query(
                "INSERT INTO registro_comidas (paciente_id, tipo_comida_id, descripcion, fecha, hora, created_at)
                 VALUES (?, ?, ?, ?, CURTIME(), NOW())",
                [$pacienteId, $tipoId, $alimentoNombre . " ({$calorias} kcal)", $fecha]
            );
        }

        return Response::success(null, 'Alimento registrado', 201);
    }

    public function buscarAlimentos($query)
    {
        if (strlen($query) < 2) {
            return Response::success([]);
        }

        // Actualizado a alimentos_opciones y sus columnas reales
        $alimentos = $this->db->query(
            "SELECT id, nombre, kcal as calorias, hidratos_de_carbono as carbohidratos, proteinas, lipidos as grasas, porcion_sugerida as porcion
             FROM alimentos_opciones
             WHERE nombre LIKE ?
             ORDER BY nombre
             LIMIT 20",
            ['%' . $query . '%']
        )->fetchAll();

        return Response::success($alimentos);
    }
}