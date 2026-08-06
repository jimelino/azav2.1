<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Utils\Response;
use App\Utils\Validator;

class MedicinaController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
    }

    // BITÁCORA DE GLUCOSA
    public function getGlucosa($pacienteId)
    {
        $registros = $this->db->query(
            "SELECT bg.*, m.nombre as momento_nombre
             FROM bitacora_glucosa bg
             LEFT JOIN momentos_medicion m ON bg.momento_id = m.id
             WHERE bg.paciente_id = ?
             ORDER BY bg.fecha DESC, bg.hora DESC
             LIMIT 50",
            [$pacienteId]
        )->fetchAll();

        // Formatear para el frontend
        $formateados = array_map(function($r) {
            return [
                'id' => $r['id'],
                'nivel_glucosa' => $r['valor'],
                'momento' => $r['momento_nombre'] ?? 'No especificado',
                'fecha_hora' => $r['fecha'] . ' ' . $r['hora'],
                'notas' => $r['notas']
            ];
        }, $registros);

        return Response::success($formateados);
    }

    public function registrarGlucosa($data)
    {
        // Aceptar tanto 'valor' como 'nivel_glucosa'
        $valor = $data['valor'] ?? $data['nivel_glucosa'] ?? null;

        if (empty($data['paciente_id']) || empty($valor)) {
            return Response::error('paciente_id y valor/nivel_glucosa son requeridos', 422);
        }

        // Obtener momento_id basado en el texto
        $momentoId = $this->getMomentoId($data['momento'] ?? 'ayunas');

        $this->db->query(
            "INSERT INTO bitacora_glucosa (paciente_id, valor, momento_id, notas, fecha, hora)
             VALUES (?, ?, ?, ?, CURDATE(), CURTIME())",
            [
                $data['paciente_id'],
                $valor,
                $momentoId,
                $data['notas'] ?? null
            ]
        );
        // Revisar si la glucosa representa un riesgo

if ($valor >= 250) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'glucosa',

        'Glucosa muy elevada',

        "Se registró una glucosa de {$valor} mg/dL.",

        'alta',

        [
            'medicina',
            'fisioterapia',
            'ortesis'
        ]

    );

}
elseif ($valor <= 60) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'glucosa',

        'Hipoglucemia',

        "Se registró una glucosa de {$valor} mg/dL.",

        'critica',

        [
            'medicina',
            'fisioterapia',
            'ortesis'
        ]

    );

}

        return Response::success(null, 'Nivel de glucosa registrado', 201);
    }

    // BITÁCORA DE PRESIÓN
    public function getPresion($pacienteId)
    {
        $registros = $this->db->query(
            "SELECT * FROM bitacora_presion
             WHERE paciente_id = ?
             ORDER BY fecha DESC, hora DESC
             LIMIT 50",
            [$pacienteId]
        )->fetchAll();

        $formateados = array_map(function($r) {
            return [
                'id' => $r['id'],
                'sistolica' => $r['sistolica'],
                'diastolica' => $r['diastolica'],
                'pulso' => $r['pulso'],
                'fecha_hora' => $r['fecha'] . ' ' . $r['hora'],
                'notas' => $r['notas']
            ];
        }, $registros);

        return Response::success($formateados);
    }

    public function registrarPresion($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'sistolica', 'diastolica']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $this->db->query(
            "INSERT INTO bitacora_presion (paciente_id, sistolica, diastolica, pulso, notas, fecha, hora)
             VALUES (?, ?, ?, ?, ?, CURDATE(), CURTIME())",
            [
                $data['paciente_id'],
                $data['sistolica'],
                $data['diastolica'],
                $data['pulso'] ?? null,
                $data['notas'] ?? null
            ]
        );
        // Revisar presión arterial

$sistolica = (int)$data['sistolica'];
$diastolica = (int)$data['diastolica'];

if ($sistolica >= 180 || $diastolica >= 120) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'presion',

        'Presión arterial crítica',

        "Se registró una presión de {$sistolica}/{$diastolica} mmHg.",

        'critica',

        [
            'medicina',
            'fisioterapia',
            'ortesis'
        ]

    );

}
elseif ($sistolica >= 160 || $diastolica >= 100) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'presion',

        'Presión arterial elevada',

        "Se registró una presión de {$sistolica}/{$diastolica} mmHg.",

        'alta',

        [
            'medicina',
            'fisioterapia',
            'ortesis'
        ]

    );

}
        

        return Response::success(null, 'Presión arterial registrada', 201);
    }

    // BITÁCORA DE DOLOR
    public function getDolor($pacienteId)
    {
        $registros = $this->db->query(
            "SELECT bd.*, u.nombre as ubicacion_nombre, t.nombre as tipo_nombre
             FROM bitacora_dolor bd
             LEFT JOIN ubicaciones_dolor u ON bd.ubicacion_id = u.id
             LEFT JOIN tipos_dolor t ON bd.tipo_dolor_id = t.id
             WHERE bd.paciente_id = ?
             ORDER BY bd.fecha DESC, bd.hora DESC
             LIMIT 50",
            [$pacienteId]
        )->fetchAll();

        $formateados = array_map(function($r) {
            return [
                'id' => $r['id'],
                'nivel_dolor' => $r['intensidad'],
                'ubicacion' => $r['ubicacion_nombre'] ?? 'No especificado',
                'tipo_dolor' => $r['tipo_nombre'] ?? 'No especificado',
                'fecha_hora' => $r['fecha'] . ' ' . $r['hora'],
                'notas' => $r['notas']
            ];
        }, $registros);

        return Response::success($formateados);
    }

    public function registrarDolor($data)
    {
        $validator = new Validator($data);
        $validator->required(['paciente_id', 'nivel_dolor', 'ubicacion']);

        if (!$validator->passes()) {
            return Response::error($validator->errors(), 422);
        }

        $this->db->query(
            "INSERT INTO bitacora_dolor (paciente_id, intensidad, ubicacion_id, tipo_dolor_id, notas, fecha, hora)
             VALUES (?, ?, ?, ?, ?, CURDATE(), CURTIME())",
            [
                $data['paciente_id'],
                $data['nivel_dolor'],
                $this->getUbicacionId($data['ubicacion']),
                $this->getTipoDolorId($data['tipo_dolor'] ?? 'agudo'),
                $data['notas'] ?? null
            ]
        );
        // Revisar nivel de dolor

$nivelDolor = (int)$data['nivel_dolor'];

if ($nivelDolor >= 8) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'dolor',

        'Dolor intenso',

        "Paciente registró un dolor de {$nivelDolor}/10.",

        'alta',

        [
            'medicina',
            'fisioterapia',
            'ortesis'
        ]

    );

}
elseif ($nivelDolor >= 6) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'dolor',

        'Dolor moderado',

        "Paciente registró un dolor de {$nivelDolor}/10.",

        'media',

        [
            'fisioterapia',
            'medicina',
            'ortesis'
        ]

    );

}

        return Response::success(null, 'Dolor registrado', 201);
    }

    // RESUMEN Y ESTADÍSTICAS
    public function getResumen($pacienteId)
    {
        // Última glucosa
        $glucosa = $this->db->query(
            "SELECT valor as ultimo FROM bitacora_glucosa
             WHERE paciente_id = ? ORDER BY fecha DESC, hora DESC LIMIT 1",
            [$pacienteId]
        )->fetch();

        // Última presión
        $presion = $this->db->query(
            "SELECT sistolica as ultima_sistolica, diastolica as ultima_diastolica
             FROM bitacora_presion
             WHERE paciente_id = ? ORDER BY fecha DESC, hora DESC LIMIT 1",
            [$pacienteId]
        )->fetch();

        // Promedio dolor última semana
        $dolor = $this->db->query(
            "SELECT AVG(intensidad) as promedio FROM bitacora_dolor
             WHERE paciente_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
            [$pacienteId]
        )->fetch();

        // Última HbA1c
        $hba1c = null;
        try {
            $hba1c = $this->db->query(
                "SELECT valor, fecha FROM bitacora_hba1c
                 WHERE paciente_id = ? ORDER BY fecha DESC LIMIT 1",
                [$pacienteId]
            )->fetch();
        } catch (\Exception $e) {}

        return Response::success([
            'glucosa' => $glucosa ?: ['ultimo' => null],
            'presion' => $presion ?: ['ultima_sistolica' => null, 'ultima_diastolica' => null],
            'dolor' => ['promedio' => $dolor['promedio'] ?? null],
            'hba1c' => $hba1c ?: ['valor' => null, 'fecha' => null]
        ]);
    }

    // BITÁCORA DE HbA1c (Hemoglobina Glicosilada)
    public function getHba1c($pacienteId)
    {
        $registros = $this->db->query(
            "SELECT * FROM bitacora_hba1c
             WHERE paciente_id = ?
             ORDER BY fecha DESC
             LIMIT 50",
            [$pacienteId]
        )->fetchAll();

        $formateados = array_map(function($r) {
            return [
                'id' => $r['id'],
                'valor' => (float)$r['valor'],
                'fecha' => $r['fecha'],
                'notas' => $r['notas'],
                'created_at' => $r['created_at']
            ];
        }, $registros);

        return Response::success($formateados);
    }

    public function registrarHba1c($data)
    {
        $valor = $data['valor'] ?? null;

        if (empty($data['paciente_id']) || $valor === null || $valor === '') {
            return Response::error('paciente_id y valor son requeridos', 422);
        }

        $valor = (float)$valor;
        if ($valor < 3.0 || $valor > 20.0) {
            return Response::error('El valor de HbA1c debe estar entre 3.0% y 20.0%', 422);
        }

        $fecha = $data['fecha'] ?? date('Y-m-d');

        $this->db->query(
            "INSERT INTO bitacora_hba1c (paciente_id, valor, notas, fecha)
             VALUES (?, ?, ?, ?)",
            [
                $data['paciente_id'],
                $valor,
                $data['notas'] ?? null,
                $fecha
            ]
        );
        // Revisar HbA1c

if ($valor >= 9.0) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'hba1c',

        'Hemoglobina glicosilada elevada',

        "Paciente registró una HbA1c de {$valor}%",

        'alta',

        [
            'medicina',
            'fisioterapia',
            'ortesis'
        ]

    );

}
elseif ($valor >= 7.0) {

    $this->crearAlertaClinica(

        $data['paciente_id'],

        'hba1c',

        'HbA1c fuera de rango',

        "Paciente registró una HbA1c de {$valor}%",

        'media',

        [
            'medicina',
            'fisioterapia',
            'ortesis'
        ]

    );

}

        return Response::success(null, 'Hemoglobina glicosilada registrada', 201);
    }

    private function getMomentoId($momento)
    {
        $momentos = [
            'ayunas' => 1, 'ayuno' => 1,
            'post_desayuno' => 2, 'despues_desayuno' => 2,
            'pre_comida' => 3, 'antes_comida' => 3,
            'post_comida' => 4, 'despues_comida' => 4,
            'pre_cena' => 5, 'antes_cena' => 5,
            'post_cena' => 6, 'despues_cena' => 6,
            'antes_dormir' => 7
        ];
        return $momentos[strtolower($momento)] ?? 1;
    }

    private function getUbicacionId($ubicacion)
    {
        // Buscar o crear ubicación
        $result = $this->db->query(
            "SELECT id FROM ubicaciones_dolor WHERE nombre LIKE ?",
            ['%' . $ubicacion . '%']
        )->fetch();

        if ($result) {
            return $result['id'];
        }

        // Por defecto retornar 1 (muñón)
        return 1;
    }

    private function getTipoDolorId($tipo)
    {
        $tipos = [
            'punzante' => 1, 'agudo' => 1,
            'sordo' => 2, 'constante' => 2,
            'quemante' => 3,
            'pulsatil' => 4, 'pulsante' => 4,
            'hormigueo' => 5,
            'calambres' => 6, 'fantasma' => 5
        ];
        return $tipos[strtolower($tipo)] ?? 1;
    }

    // ============ RECETAS MÉDICAS (MEDICAMENTOS) ============

    /**
     * Listar medicamentos de un paciente
     */
    public function getMedicamentos($pacienteId)
    {
        $medicamentos = $this->db->query(
            "SELECT mp.*, u.nombre_completo as prescrito_por_nombre
             FROM medicamentos_paciente mp
             LEFT JOIN usuarios u ON mp.creado_por = u.id
             WHERE mp.paciente_id = ?
             ORDER BY mp.activo DESC, mp.created_at DESC",
            [$pacienteId]
        )->fetchAll();

        return Response::success($medicamentos);
    }

    /**
     * Crear nuevo medicamento (receta médica)
     */
    public function crearMedicamento($data)
    {
        $user = \App\Middleware\AuthMiddleware::getCurrentUser();

        // Soporta un solo medicamento o un array de medicamentos
        $medicamentos = isset($data['medicamentos']) ? $data['medicamentos'] : [$data];
        $pacienteId = $data['paciente_id'] ?? null;

        if (!$pacienteId) {
            return Response::error('paciente_id es requerido', 422);
        }

        $ids = [];
        foreach ($medicamentos as $med) {
            $nombreComercial = trim($med['nombre_comercial'] ?? '');
            $dosis = trim($med['dosis'] ?? '');
            $frecuencia = trim($med['frecuencia'] ?? '');
            $fechaInicio = trim($med['fecha_inicio'] ?? '');

            if (empty($nombreComercial) || empty($dosis) || empty($frecuencia) || empty($fechaInicio)) {
                continue;
            }

            $this->db->query(
                "INSERT INTO medicamentos_paciente
                 (paciente_id, nombre_comercial, nombre_generico, dosis, frecuencia,
                  via_administracion, instrucciones_especiales, fecha_inicio, fecha_fin,
                  activo, creado_por, notas_medico)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
                [
                    $pacienteId,
                    $nombreComercial,
                    !empty($med['nombre_generico']) ? $med['nombre_generico'] : null,
                    $dosis,
                    $frecuencia,
                    !empty($med['via_administracion']) ? $med['via_administracion'] : 'oral',
                    !empty($med['instrucciones_especiales']) ? $med['instrucciones_especiales'] : null,
                    $fechaInicio,
                    !empty($med['fecha_fin']) ? $med['fecha_fin'] : null,
                    $user['id'],
                    !empty($med['notas_medico']) ? $med['notas_medico'] : null
                ]
            );
            $ids[] = $this->db->lastInsertId();
        }

        if (empty($ids)) {
            return Response::error('Al menos un medicamento con nombre, dosis, frecuencia y fecha es requerido', 422);
        }

        return Response::success(['ids' => $ids], 'Medicamento(s) prescrito(s) correctamente', 201);
    }

    /**
     * Actualizar medicamento
     */
    public function actualizarMedicamento($id)
    {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $medicamento = $this->db->query(
            "SELECT * FROM medicamentos_paciente WHERE id = ?",
            [(int)$id]
        )->fetch();

        if (!$medicamento) {
            return Response::error('Medicamento no encontrado', 404);
        }

        $this->db->query(
            "UPDATE medicamentos_paciente SET
             nombre_comercial = ?, nombre_generico = ?, dosis = ?, frecuencia = ?,
             via_administracion = ?, instrucciones_especiales = ?, fecha_inicio = ?,
             fecha_fin = ?, activo = ?, notas_medico = ?
             WHERE id = ?",
            [
                $data['nombre_comercial'] ?? $medicamento['nombre_comercial'],
                $data['nombre_generico'] ?? $medicamento['nombre_generico'],
                $data['dosis'] ?? $medicamento['dosis'],
                $data['frecuencia'] ?? $medicamento['frecuencia'],
                $data['via_administracion'] ?? $medicamento['via_administracion'],
                $data['instrucciones_especiales'] ?? $medicamento['instrucciones_especiales'],
                $data['fecha_inicio'] ?? $medicamento['fecha_inicio'],
                $data['fecha_fin'] ?? $medicamento['fecha_fin'],
                $data['activo'] ?? $medicamento['activo'],
                $data['notas_medico'] ?? $medicamento['notas_medico'],
                (int)$id
            ]
        );

        return Response::success(null, 'Medicamento actualizado');
    }

    /**
     * Desactivar/eliminar medicamento
     */
    public function eliminarMedicamento($id)
    {
        $medicamento = $this->db->query(
            "SELECT * FROM medicamentos_paciente WHERE id = ?",
            [(int)$id]
        )->fetch();

        if (!$medicamento) {
            return Response::error('Medicamento no encontrado', 404);
        }

        // Desactivar en vez de eliminar para mantener historial
        $this->db->query(
            "UPDATE medicamentos_paciente SET activo = 0, fecha_fin = CURDATE() WHERE id = ?",
            [(int)$id]
        );

        return Response::success(null, 'Medicamento desactivado');
    }
    /**
 * Crear alerta clínica
 */
private function crearAlertaClinica(
    $pacienteId,
    $tipo,
    $titulo,
    $descripcion,
    $prioridad,
    $areas
)
{
    foreach ($areas as $area) {

        // Evitar duplicados
        $existe = $this->db->query(
            "SELECT id
             FROM alertas_clinicas
             WHERE paciente_id = ?
             AND tipo_alerta = ?
             AND area_destino = ?
             AND estado = 'pendiente'
             LIMIT 1",
            [
                $pacienteId,
                $tipo,
                $area
            ]
        )->fetch();

        if ($existe) {
            continue;
        }

        $this->db->query(
            "INSERT INTO alertas_clinicas
            (
                paciente_id,
                area_destino,
                tipo_alerta,
                titulo,
                descripcion,
                prioridad,
                estado,
                created_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, 'pendiente', NOW())",
            [
                $pacienteId,
                $area,
                $tipo,
                $titulo,
                $descripcion,
                $prioridad
            ]
        );
    }
}
}
