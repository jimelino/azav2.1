<?php

namespace App\Controllers;

use App\Services\DatabaseService;
use App\Services\AlimentosDatabase;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use App\Models\PlanEquivalente;

class PlanNutricionalController
{
    private $db;
    private $uploadDir;

    public function __construct()
    {
        $this->db = DatabaseService::getInstance();
        $this->uploadDir = __DIR__ . '/../../uploads/planes_nutricionales/';

        // Crear directorio si no existe
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    /**
     * Subir PDF y crear plan nutricional
     */
    public function uploadPlan($especialistaId)
    {
        try {
            // Verificar que se subió un archivo
            if (!isset($_FILES['pdf']) || $_FILES['pdf']['error'] !== UPLOAD_ERR_OK) {
                return Response::error('No se recibió el archivo PDF', 400);
            }

            $file = $_FILES['pdf'];

            // Validar tipo de archivo (PDF o DOCX)
            $allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
                'application/msword', // DOC antiguo
                'application/zip' // A veces DOCX se detecta como ZIP
            ];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            // Verificar también la extensión para DOCX
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $isDocx = in_array($extension, ['docx', 'doc']);
            $isPdf = $extension === 'pdf';

            if (!in_array($mimeType, $allowedTypes) && !$isDocx && !$isPdf) {
                return Response::error('Solo se permiten archivos PDF o DOCX', 400);
            }

            // Validar tamaño (máx 10MB)
            if ($file['size'] > 10 * 1024 * 1024) {
                return Response::error('El archivo no puede superar 10MB', 400);
            }

            // Generar nombre único
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $nombreArchivo = 'plan_' . $especialistaId . '_' . time() . '_' . uniqid() . '.' . $extension;
            $rutaArchivo = $this->uploadDir . $nombreArchivo;

            // Mover archivo
            if (!move_uploaded_file($file['tmp_name'], $rutaArchivo)) {
                return Response::error('Error al guardar el archivo', 500);
            }

            // Use pre-extracted text from frontend (pdf.js) if available
            // This is much more reliable than PHP native PDF extraction
            if (!empty($_POST['texto_extraido']) && strlen($_POST['texto_extraido']) > 50) {
                $textoExtraido = $_POST['texto_extraido'];
            } elseif ($isDocx || $extension === 'docx' || $extension === 'doc') {
                $textoExtraido = $this->extractTextFromDOCX($rutaArchivo);
            } else {
                $textoExtraido = $this->extractTextFromPDF($rutaArchivo);
            }

            // Sanitizar texto a UTF-8 válido
            $textoExtraido = $this->sanitizeUtf8($textoExtraido);

            // Detectar formato del plan y procesar según corresponda
            $formatoPlan = $this->detectarFormatoPlan($textoExtraido);
            if ($formatoPlan === 'equivalentes') {
                $contenidoJSON = $this->procesarTextoEquivalentes($textoExtraido);
            } elseif ($formatoPlan === 'recetas') {
                $contenidoJSON = $this->procesarTextoRecetas($textoExtraido);
            } else {
                $contenidoJSON = $this->procesarTextoAJSON($textoExtraido);
            }

            // Obtener datos del formulario
            $nombre = $_POST['nombre'] ?? 'Plan Nutricional ' . date('d/m/Y');
            $descripcion = $_POST['descripcion'] ?? null;

            // Asegurar que el JSON sea válido
            // Primero, sanitizar recursivamente el array para asegurar UTF-8
            $contenidoJSON = $this->sanitizeArrayUtf8($contenidoJSON);

            $jsonString = json_encode($contenidoJSON, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            if ($jsonString === false) {
                error_log('Error json_encode: ' . json_last_error_msg());
                // Si falla, crear un JSON mínimo válido con el texto sanitizado
                $textoLimpio = mb_convert_encoding($textoExtraido, 'UTF-8', 'UTF-8');
                $textoLimpio = preg_replace('/[^\x20-\x7E\xA0-\xFF\n\r\t]/u', '', $textoLimpio);

                $jsonString = json_encode([
                    'titulo' => $nombre,
                    'descripcion' => 'Plan importado desde PDF',
                    'totales' => ['calorias' => 0, 'proteinas' => 0, 'carbohidratos' => 0, 'grasas' => 0],
                    'comidas' => $contenidoJSON['comidas'] ?? [],
                    'recomendaciones' => [],
                    'restricciones' => [],
                    'texto_original' => substr($textoLimpio, 0, 10000) ?: 'Texto extraído no disponible'
                ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            }

            // Insertar en base de datos (primero sin imágenes para obtener el ID)
            $this->db->query(
                "INSERT INTO planes_nutricionales
                 (nombre, descripcion, especialista_id, archivo_pdf, archivo_nombre, contenido_json,
                  calorias_diarias, proteinas_g, carbohidratos_g, grasas_g, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'borrador')",
                [
                    $nombre,
                    $descripcion,
                    $especialistaId,
                    $nombreArchivo,
                    $file['name'],
                    $jsonString,
                    $contenidoJSON['totales']['calorias'] ?? null,
                    $contenidoJSON['totales']['proteinas'] ?? null,
                    $contenidoJSON['totales']['carbohidratos'] ?? null,
                    $contenidoJSON['totales']['grasas'] ?? null
                ]
            );

            $planId = $this->db->lastInsertId();

            // Extraer imágenes del DOCX (si aplica)
            $imagenes = [];
            if ($isDocx || $extension === 'docx') {
                $imagenes = $this->extractImagesFromDOCX($rutaArchivo, $planId);

                // Si se encontraron imágenes, actualizar el contenido JSON
                if (!empty($imagenes)) {
                    $contenidoJSON['imagenes'] = $imagenes;
                    $contenidoJSON['graficas'] = $this->clasificarImagenes($imagenes, $textoExtraido);

                    // Actualizar el JSON en la base de datos con las imágenes
                    $jsonStringActualizado = json_encode($contenidoJSON, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
                    $this->db->query(
                        "UPDATE planes_nutricionales SET contenido_json = ? WHERE id = ?",
                        [$jsonStringActualizado, $planId]
                    );
                }
            }

            // Insertar las comidas individuales si existen
            if (!empty($contenidoJSON['comidas'])) {
                $this->insertarComidasPlan($planId, $contenidoJSON['comidas']);
            }

            return Response::success([
                'plan_id' => $planId,
                'nombre' => $nombre,
                'contenido' => $contenidoJSON,
                'imagenes' => $imagenes,
                'texto_extraido' => $textoExtraido
            ], 'Plan nutricional creado exitosamente', 201);

        } catch (\Exception $e) {
            error_log('Error en uploadPlan: ' . $e->getMessage());
            return Response::error('Error al procesar el plan: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Extraer texto de un PDF
     */
    private function extractTextFromPDF($rutaPDF)
    {
        $texto = '';

        // Intentar con pdftotext si está disponible (Linux/Mac)
        if ($this->commandExists('pdftotext')) {
            $tempFile = tempnam(sys_get_temp_dir(), 'pdf_');
            exec("pdftotext -layout " . escapeshellarg($rutaPDF) . " " . escapeshellarg($tempFile) . " 2>&1", $output, $returnCode);

            if ($returnCode === 0 && file_exists($tempFile)) {
                $texto = file_get_contents($tempFile);
                unlink($tempFile);
            }
        }

        // Si no funcionó, intentar con PHP nativo (básico)
        if (empty($texto)) {
            $texto = $this->extractTextPHPNative($rutaPDF);
        }

        return $texto;
    }

    /**
     * Extracción básica de texto de PDF con PHP
     */
    private function extractTextPHPNative($rutaPDF)
    {
        $content = file_get_contents($rutaPDF);
        $texto = '';

        // Buscar streams de texto en el PDF
        if (preg_match_all('/stream\s*(.*?)\s*endstream/s', $content, $matches)) {
            foreach ($matches[1] as $stream) {
                // Intentar descomprimir si está comprimido con zlib
                $decompressed = @gzuncompress($stream);
                if ($decompressed !== false) {
                    $stream = $decompressed;
                }

                // Extraer texto de operadores Tj y TJ
                if (preg_match_all('/\[(.*?)\]\s*TJ/s', $stream, $textMatches)) {
                    foreach ($textMatches[1] as $text) {
                        // Limpiar y extraer strings
                        if (preg_match_all('/\((.*?)\)/s', $text, $stringMatches)) {
                            $texto .= implode('', $stringMatches[1]) . ' ';
                        }
                    }
                }
                if (preg_match_all('/\((.*?)\)\s*Tj/s', $stream, $textMatches)) {
                    $texto .= implode(' ', $textMatches[1]) . ' ';
                }
            }
        }

        return trim($texto);
    }

    /**
     * Extraer texto de un archivo DOCX
     * Los archivos DOCX son ZIP que contienen XML
     */
    private function extractTextFromDOCX($rutaDOCX)
    {
        $texto = '';

        try {
            // DOCX es un archivo ZIP
            $zip = new \ZipArchive();

            if ($zip->open($rutaDOCX) === true) {
                // El contenido principal está en word/document.xml
                $xmlContent = $zip->getFromName('word/document.xml');

                if ($xmlContent !== false) {
                    // Parsear el XML
                    $dom = new \DOMDocument();
                    $dom->loadXML($xmlContent, LIBXML_NOERROR | LIBXML_NOWARNING);

                    // Extraer todos los nodos de texto (w:t)
                    $xpath = new \DOMXPath($dom);
                    $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');

                    // Buscar todos los elementos de texto
                    $textNodes = $xpath->query('//w:t');

                    $currentParagraph = '';
                    $lastParent = null;

                    foreach ($textNodes as $node) {
                        // Detectar saltos de párrafo
                        $parent = $node->parentNode;
                        while ($parent && $parent->nodeName !== 'w:p') {
                            $parent = $parent->parentNode;
                        }

                        if ($lastParent !== null && $parent !== $lastParent) {
                            // Nuevo párrafo
                            $texto .= $currentParagraph . "\n";
                            $currentParagraph = '';
                        }

                        $currentParagraph .= $node->nodeValue;
                        $lastParent = $parent;
                    }

                    // Agregar último párrafo
                    if (!empty($currentParagraph)) {
                        $texto .= $currentParagraph;
                    }
                }

                $zip->close();
            }

        } catch (\Exception $e) {
            error_log('Error extrayendo texto de DOCX: ' . $e->getMessage());
        }

        // Si no se pudo extraer, intentar método alternativo
        if (empty($texto)) {
            $texto = $this->extractTextFromDOCXSimple($rutaDOCX);
        }

        return trim($texto);
    }

    /**
     * Extraer imágenes de un archivo DOCX
     * Retorna array con rutas de las imágenes guardadas
     */
    private function extractImagesFromDOCX($rutaDOCX, $planId)
    {
        $imagenes = [];
        $imageDir = __DIR__ . '/../../uploads/planes_imagenes/' . $planId . '/';

        // Crear directorio si no existe
        if (!is_dir($imageDir)) {
            mkdir($imageDir, 0755, true);
        }

        try {
            $zip = new \ZipArchive();

            if ($zip->open($rutaDOCX) === true) {
                // Buscar imágenes en word/media/
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $filename = $zip->getNameIndex($i);

                    // Verificar si es una imagen en word/media/
                    if (preg_match('/^word\/media\/(image\d+\.(png|jpg|jpeg|gif|bmp|wmf|emf))$/i', $filename, $matches)) {
                        $imageContent = $zip->getFromIndex($i);

                        if ($imageContent !== false) {
                            // Generar nombre único para la imagen
                            $extension = strtolower(pathinfo($matches[1], PATHINFO_EXTENSION));
                            // Convertir wmf/emf a png si es necesario (estos formatos no son soportados en web)
                            if (in_array($extension, ['wmf', 'emf'])) {
                                continue; // Saltar formatos no soportados en web
                            }

                            $newFilename = 'img_' . $i . '_' . time() . '.' . $extension;
                            $savePath = $imageDir . $newFilename;

                            if (file_put_contents($savePath, $imageContent)) {
                                // Intentar detectar el título/descripción de la imagen del documento
                                $titulo = $this->detectarTituloImagen($rutaDOCX, $matches[1]);

                                $imagenes[] = [
                                    'filename' => $newFilename,
                                    'path' => '/uploads/planes_imagenes/' . $planId . '/' . $newFilename,
                                    'original_name' => $matches[1],
                                    'titulo' => $titulo,
                                    'size' => strlen($imageContent)
                                ];
                            }
                        }
                    }
                }

                $zip->close();
            }

        } catch (\Exception $e) {
            error_log('Error extrayendo imágenes de DOCX: ' . $e->getMessage());
        }

        return $imagenes;
    }

    /**
     * Detectar título de una imagen basándose en el texto cercano
     */
    private function detectarTituloImagen($rutaDOCX, $imageName)
    {
        $titulo = '';

        try {
            $zip = new \ZipArchive();

            if ($zip->open($rutaDOCX) === true) {
                $xmlContent = $zip->getFromName('word/document.xml');
                $zip->close();

                if ($xmlContent !== false) {
                    // Buscar referencias a la imagen y texto cercano
                    // Buscar patrones como "Gráfica de..." antes de la imagen
                    if (preg_match('/Gr[aá]fica\s+de\s+[^<]+/iu', $xmlContent, $matches)) {
                        $titulo = trim($matches[0]);
                    }
                }
            }
        } catch (\Exception $e) {
            // Ignorar errores al detectar título
        }

        return $titulo;
    }

    /**
     * Clasificar imágenes basándose en el texto del documento
     */
    private function clasificarImagenes($imagenes, $textoDocumento)
    {
        $graficas = [];
        $textoLower = mb_strtolower($textoDocumento);

        // Detectar si hay referencias a gráficas específicas en el texto
        $tiposGrafica = [
            'indice_glucemico' => ['índice glucémico', 'indice glucemico', 'glucémico'],
            'grupos_alimentos' => ['grupos de alimentos', 'grupo de alimentos'],
            'plato_buen_comer' => ['plato del buen comer', 'plato buen comer'],
            'piramide_alimenticia' => ['pirámide alimenticia', 'piramide alimenticia', 'pirámide nutricional']
        ];

        $tiposDetectados = [];
        foreach ($tiposGrafica as $tipo => $palabras) {
            foreach ($palabras as $palabra) {
                if (mb_strpos($textoLower, $palabra) !== false) {
                    $tiposDetectados[] = $tipo;
                    break;
                }
            }
        }

        // Asignar tipos a las imágenes encontradas
        foreach ($imagenes as $idx => $imagen) {
            $grafica = [
                'imagen' => $imagen,
                'tipo' => 'general',
                'titulo' => 'Gráfica informativa ' . ($idx + 1)
            ];

            // Intentar asignar un tipo específico si se detectó
            if (isset($tiposDetectados[$idx])) {
                $grafica['tipo'] = $tiposDetectados[$idx];
                switch ($tiposDetectados[$idx]) {
                    case 'indice_glucemico':
                        $grafica['titulo'] = 'Índice Glucémico en los Alimentos';
                        $grafica['descripcion'] = 'Clasificación de alimentos según su índice glucémico: bajo, medio y alto.';
                        break;
                    case 'grupos_alimentos':
                        $grafica['titulo'] = 'Grupos de Alimentos';
                        $grafica['descripcion'] = 'Clasificación de los diferentes grupos alimenticios.';
                        break;
                    case 'plato_buen_comer':
                        $grafica['titulo'] = 'El Plato del Buen Comer';
                        $grafica['descripcion'] = 'Guía visual para una alimentación balanceada.';
                        break;
                    case 'piramide_alimenticia':
                        $grafica['titulo'] = 'Pirámide Alimenticia';
                        $grafica['descripcion'] = 'Distribución recomendada de alimentos.';
                        break;
                }
            } else {
                // Asignar basándose en el nombre del archivo si está disponible
                if (!empty($imagen['titulo'])) {
                    $grafica['titulo'] = $imagen['titulo'];
                }
            }

            $graficas[] = $grafica;
        }

        return $graficas;
    }

    /**
     * Método alternativo simple para extraer texto de DOCX
     */
    private function extractTextFromDOCXSimple($rutaDOCX)
    {
        $texto = '';

        try {
            $zip = new \ZipArchive();

            if ($zip->open($rutaDOCX) === true) {
                $xmlContent = $zip->getFromName('word/document.xml');
                $zip->close();

                if ($xmlContent !== false) {
                    // Método simple: strip tags y limpiar
                    $texto = strip_tags($xmlContent);
                    // Limpiar espacios múltiples
                    $texto = preg_replace('/\s+/', ' ', $texto);
                    // Intentar restaurar saltos de línea donde había párrafos
                    $texto = preg_replace('/<\/w:p>/i', "\n", $xmlContent);
                    $texto = strip_tags($texto);
                    $texto = preg_replace('/\s+/', ' ', $texto);
                    $texto = preg_replace('/ +/', ' ', $texto);
                }
            }
        } catch (\Exception $e) {
            error_log('Error en extractTextFromDOCXSimple: ' . $e->getMessage());
        }

        return trim($texto);
    }

    /**
     * Procesar texto extraído y convertir a JSON estructurado
     * Optimizado para formato UIOyP y otros formatos comunes de planes nutricionales
     */
    private function procesarTextoAJSON($texto)
    {
        $resultado = [
            'titulo' => '',
            'descripcion' => '',
            'paciente' => '',
            'fecha' => '',
            'siguiente_cita' => '',
            'elaboro' => '',
            'objetivo' => '',
            'indicaciones_generales' => [],
            'totales' => [
                'calorias' => 0,
                'proteinas' => 0,
                'carbohidratos' => 0,
                'grasas' => 0,
                'fibra' => 0
            ],
            'comidas' => [],
            'recomendaciones' => [],
            'restricciones' => [],
            'texto_original' => $texto
        ];

        // Si el texto está vacío, retornar estructura básica
        if (empty($texto)) {
            return $resultado;
        }

        try {

        // Extraer información del encabezado
        if (preg_match('/PLAN DE ALIMENTACI[OÓ]N PARA[:\s]*(.+?)(?=Fecha|$)/isu', $texto, $matches)) {
            $resultado['paciente'] = trim($matches[1]);
        }
        if (preg_match('/Fecha de hoy[:\s]*([^\n]+)/i', $texto, $matches)) {
            $resultado['fecha'] = trim($matches[1]);
        }
        if (preg_match('/Siguiente cita[:\s]*([^\n]+)/i', $texto, $matches)) {
            $resultado['siguiente_cita'] = trim($matches[1]);
        }
        if (preg_match('/Elabor[oó][:\s]*([^\n]+)/i', $texto, $matches)) {
            $resultado['elaboro'] = trim($matches[1]);
        }
        if (preg_match('/Objetivo[:\s]*([^\n]+)/i', $texto, $matches)) {
            $resultado['objetivo'] = trim($matches[1]);
        }

        // Extraer indicaciones generales
        if (preg_match('/Indicaciones generales[:\s]*(.+?)(?=Men[uú]:|Desayuno|$)/isu', $texto, $matches)) {
            $indicaciones = preg_split('/(?=Seguir|Recuerde|Tomar|Respetar|Ingerir|En el caso)/i', $matches[1]);
            foreach ($indicaciones as $ind) {
                $ind = trim($ind);
                if (strlen($ind) > 10) {
                    $resultado['indicaciones_generales'][] = $ind;
                }
            }
        }

        // Dividir el texto por secciones de comida
        // Patrón para detectar: "Desayuno Horario: 7:30", "Almuerzo Horario: 12:00", etc.
        $patronSeccionComida = '/(Desayuno|Almuerzo|Comida|Cena|Colaci[oó]n\s*\d*|Merienda)\s+Horario[:\s]*(\d{1,2}:\d{2})/iu';

        // Encontrar todas las secciones de comida
        preg_match_all($patronSeccionComida, $texto, $seccionesMatches, PREG_OFFSET_CAPTURE);

        if (!empty($seccionesMatches[0])) {
            $tiposComidaNormalizados = [
                'desayuno' => 'desayuno',
                'almuerzo' => 'almuerzo',
                'comida' => 'cena',
                'cena' => 'cena',
                'colacion' => 'snack',
                'colación' => 'snack',
                'merienda' => 'merienda'
            ];

            for ($i = 0; $i < count($seccionesMatches[0]); $i++) {
                $tipoRaw = $seccionesMatches[1][$i][0];
                $horario = $seccionesMatches[2][$i][0];
                $posInicio = $seccionesMatches[0][$i][1];

                // Encontrar el final de esta sección (inicio de la siguiente o fin de menú)
                $posFin = isset($seccionesMatches[0][$i + 1])
                    ? $seccionesMatches[0][$i + 1][1]
                    : strpos($texto, 'Recomendaciones:');

                if ($posFin === false) {
                    $posFin = strlen($texto);
                }

                $contenidoSeccion = substr($texto, $posInicio, $posFin - $posInicio);

                // Normalizar tipo de comida
                $tipoNormalizado = mb_strtolower(preg_replace('/\s*\d+$/', '', trim($tipoRaw)));
                $tipoNormalizado = str_replace(['á', 'é', 'í', 'ó', 'ú'], ['a', 'e', 'i', 'o', 'u'], $tipoNormalizado);
                $tipoComida = $tiposComidaNormalizados[$tipoNormalizado] ?? 'snack';

                // Extraer opciones de platillos
                // Formato: "Nombre del platillo: Descripción detallada..."
                $opciones = $this->extraerOpcionesPlatillos($contenidoSeccion);

                $comida = [
                    'dia_semana' => 'lunes',
                    'tipo_comida' => $tipoComida,
                    'nombre_original' => $tipoRaw,
                    'horario' => $horario,
                    'nombre_plato' => ucfirst($tipoNormalizado) . ' - ' . count($opciones) . ' opciones',
                    'descripcion' => '',
                    'opciones' => $opciones,
                    'ingredientes' => [],
                    'calorias' => 0,
                    'proteinas_g' => 0,
                    'carbohidratos_g' => 0,
                    'grasas_g' => 0
                ];

                $resultado['comidas'][] = $comida;
            }

            // Calcular totales estimados basándose en las opciones promedio de cada comida
            $totalCalorias = 0;
            $totalProteinas = 0;
            $totalCarbos = 0;
            $totalGrasas = 0;

            foreach ($resultado['comidas'] as &$comida) {
                // Calcular promedio de calorías de las opciones de esta comida
                $caloriasComida = 0;
                $proteinasComida = 0;
                $carbosComida = 0;
                $grasasComida = 0;
                $numOpciones = count($comida['opciones']);

                if ($numOpciones > 0) {
                    foreach ($comida['opciones'] as $opcion) {
                        $caloriasComida += $opcion['calorias_estimadas'] ?? 0;
                        $proteinasComida += $opcion['proteinas_estimadas'] ?? 0;
                        $carbosComida += $opcion['carbohidratos_estimados'] ?? 0;
                        $grasasComida += $opcion['grasas_estimadas'] ?? 0;
                    }

                    // Usar promedio de las opciones para esta comida
                    $comida['calorias'] = round($caloriasComida / $numOpciones);
                    $comida['proteinas_g'] = round($proteinasComida / $numOpciones, 1);
                    $comida['carbohidratos_g'] = round($carbosComida / $numOpciones, 1);
                    $comida['grasas_g'] = round($grasasComida / $numOpciones, 1);

                    // Sumar al total diario
                    $totalCalorias += $comida['calorias'];
                    $totalProteinas += $comida['proteinas_g'];
                    $totalCarbos += $comida['carbohidratos_g'];
                    $totalGrasas += $comida['grasas_g'];
                }
            }

            // Solo actualizar totales si se calcularon calorías
            if ($totalCalorias > 0) {
                $resultado['totales']['calorias'] = $totalCalorias;
                $resultado['totales']['proteinas'] = $totalProteinas;
                $resultado['totales']['carbohidratos'] = $totalCarbos;
                $resultado['totales']['grasas'] = $totalGrasas;
                $resultado['totales']['estimado'] = true;
            }
        }

        // Extraer recomendaciones
        if (preg_match('/Recomendaciones[:\s]*(Generales)?(.+?)(?=Gr[aá]fica|UNIDAD DE INVESTIGACI|$)/isu', $texto, $matches)) {
            $textoRecomendaciones = $matches[2];
            $recomendaciones = preg_split('/(?=Dormir|Limitar|Comer|Cuidar|Evita|Opta)/i', $textoRecomendaciones);
            foreach ($recomendaciones as $rec) {
                $rec = trim($rec);
                if (strlen($rec) > 10 && !preg_match('/^(UNIDAD|Servicio)/i', $rec)) {
                    $resultado['recomendaciones'][] = $rec;
                }
            }
        }

        // Extraer restricciones/cosas a evitar
        preg_match_all('/Evitar[:\s]*([^\.]+\.)/i', $texto, $restriccionesMatches);
        if (!empty($restriccionesMatches[1])) {
            foreach ($restriccionesMatches[1] as $restriccion) {
                $restriccion = trim($restriccion);
                if (strlen($restriccion) > 5) {
                    $resultado['restricciones'][] = 'Evitar ' . $restriccion;
                }
            }
        }

        // Buscar calorías si las hay en el documento
        if (preg_match('/(\d{4})\s*(kcal|cal|calorías)/i', $texto, $matches)) {
            $resultado['totales']['calorias'] = (int)$matches[1];
        }

        // Buscar macros si los hay
        if (preg_match('/prote[ií]nas?[:\s]*(\d+(?:[,\.]\d+)?)\s*g/i', $texto, $matches)) {
            $resultado['totales']['proteinas'] = (float)str_replace(',', '.', $matches[1]);
        }
        if (preg_match('/carbohidratos?[:\s]*(\d+(?:[,\.]\d+)?)\s*g/i', $texto, $matches)) {
            $resultado['totales']['carbohidratos'] = (float)str_replace(',', '.', $matches[1]);
        }
        if (preg_match('/grasas?[:\s]*(\d+(?:[,\.]\d+)?)\s*g/i', $texto, $matches)) {
            $resultado['totales']['grasas'] = (float)str_replace(',', '.', $matches[1]);
        }

        } catch (\Exception $e) {
            error_log('Error en procesarTextoAJSON: ' . $e->getMessage());
            // Retornar estructura básica con el texto original
            $resultado['descripcion'] = 'Error al procesar el plan: ' . $e->getMessage();
        }

        return $resultado;
    }

    /**
     * Extraer opciones de platillos de una sección de comida
     * Método robusto que detecta todos los platillos del documento
     */
    private function extraerOpcionesPlatillos($textoSeccion)
    {
        $opciones = [];
        $opcionesEncontradas = []; // Para evitar duplicados

        try {
            // Remover el encabezado de la sección (Desayuno Horario: X:XX Opciones:)
            $textoLimpio = preg_replace('/^.+?Opciones[:\s]*/isu', '', $textoSeccion);

            if (empty($textoLimpio)) {
                $textoLimpio = $textoSeccion;
            }

            // MÉTODO PRINCIPAL: Buscar patrón "Nombre del platillo: descripción..."
            // Este patrón captura nombres que empiezan con mayúscula seguidos de : y descripción
            // hasta encontrar otro nombre con mayúscula y : o fin de texto

            // Primero, normalizar el texto para facilitar la detección
            $textoNormalizado = preg_replace('/\s+/', ' ', $textoLimpio);

            // Patrón mejorado: captura "Nombre platillo:" seguido de descripción
            // El nombre puede contener letras, espacios, tildes y algunos caracteres especiales
            $patron = '/([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,50}?):\s*(.+?)(?=(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,50}:)|$)/su';

            if (preg_match_all($patron, $textoNormalizado, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $match) {
                    $nombre = trim($match[1]);
                    $descripcion = trim($match[2]);

                    // Filtrar encabezados y palabras clave del sistema
                    $palabrasExcluidas = [
                        'UNIDAD', 'Servicio', 'Horario', 'Opciones', 'Macro', 'Función',
                        'Objetivo', 'Indicaciones', 'Recomendaciones', 'Elaboró', 'Fecha',
                        'Siguiente', 'Plan', 'Menú', 'Desayuno', 'Almuerzo', 'Comida',
                        'Cena', 'Colación', 'Merienda', 'Snack', 'Gráfica'
                    ];

                    $esExcluido = false;
                    foreach ($palabrasExcluidas as $excluida) {
                        if (stripos($nombre, $excluida) === 0) {
                            $esExcluido = true;
                            break;
                        }
                    }

                    if ($esExcluido) continue;

                    // Validar que el nombre sea razonable (al menos 3 caracteres)
                    if (mb_strlen($nombre) < 3) continue;

                    // Validar que no sea solo números o caracteres especiales
                    if (!preg_match('/[a-záéíóúñA-ZÁÉÍÓÚÑ]{2,}/u', $nombre)) continue;

                    // Limpiar descripción
                    $descripcion = preg_replace('/\s+/', ' ', $descripcion);
                    $descripcion = trim($descripcion);

                    // Evitar duplicados (usando nombre normalizado)
                    $nombreKey = mb_strtolower($nombre);
                    if (isset($opcionesEncontradas[$nombreKey])) continue;
                    $opcionesEncontradas[$nombreKey] = true;

                    // Si la descripción está vacía, usar el nombre como descripción
                    if (empty($descripcion) || mb_strlen($descripcion) < 5) {
                        $descripcion = $nombre;
                    }

                    // Calcular calorías estimadas
                    $textoParaCalorias = $descripcion;
                    $nutricion = AlimentosDatabase::calcularCaloriasPlatillo($textoParaCalorias);

                    $opciones[] = [
                        'numero' => count($opciones) + 1,
                        'nombre' => $nombre,
                        'descripcion' => mb_substr($descripcion, 0, 300),
                        'items' => $this->extraerIngredientes($descripcion),
                        'calorias_estimadas' => $nutricion['calorias'],
                        'proteinas_estimadas' => $nutricion['proteinas'],
                        'carbohidratos_estimados' => $nutricion['carbohidratos'],
                        'grasas_estimadas' => $nutricion['grasas'],
                        'confianza' => $nutricion['confianza'],
                        'ingredientes_detectados' => $nutricion['ingredientes_detectados']
                    ];
                }
            }

            // MÉTODO ALTERNATIVO: Si no se encontraron opciones, buscar por líneas
            if (empty($opciones)) {
                $lineas = preg_split('/\r?\n/', $textoLimpio);
                foreach ($lineas as $linea) {
                    $linea = trim($linea);
                    if (empty($linea) || mb_strlen($linea) < 10) continue;

                    // Buscar patrón "Nombre: descripción" en cada línea
                    if (preg_match('/^([A-Za-zÁÉÍÓÚÑáéíóúñ][^:]{2,45}):\s*(.+)/', $linea, $match)) {
                        $nombre = trim($match[1]);
                        $descripcion = trim($match[2]);

                        // Filtrar encabezados
                        if (preg_match('/^(UNIDAD|Servicio|Horario|Opciones|Macro|Función|Objetivo)/i', $nombre)) {
                            continue;
                        }

                        // Evitar duplicados
                        $nombreKey = mb_strtolower($nombre);
                        if (isset($opcionesEncontradas[$nombreKey])) continue;
                        $opcionesEncontradas[$nombreKey] = true;

                        // Calcular calorías estimadas
                        $nutricion = AlimentosDatabase::calcularCaloriasPlatillo($descripcion);

                        $opciones[] = [
                            'numero' => count($opciones) + 1,
                            'nombre' => $nombre,
                            'descripcion' => $descripcion,
                            'items' => $this->extraerIngredientes($descripcion),
                            'calorias_estimadas' => $nutricion['calorias'],
                            'proteinas_estimadas' => $nutricion['proteinas'],
                            'carbohidratos_estimados' => $nutricion['carbohidratos'],
                            'grasas_estimadas' => $nutricion['grasas'],
                            'confianza' => $nutricion['confianza'],
                            'ingredientes_detectados' => $nutricion['ingredientes_detectados']
                        ];
                    }
                }
            }

        } catch (\Exception $e) {
            error_log('Error en extraerOpcionesPlatillos: ' . $e->getMessage());
        }

        return $opciones;
    }

    /**
     * Extraer ingredientes de una descripción de platillo
     */
    private function extraerIngredientes($descripcion)
    {
        $ingredientes = [];

        // Buscar patrones de ingredientes con cantidades
        // Ejemplos: "1 taza", "½ cucharadita", "2 piezas", "100g"
        $patronIngrediente = '/(\d+(?:\/\d+)?|½|¼|¾)\s*(tazas?|piezas?|cucharadas?|cucharaditas?|g|gr|ml|rebanadas?|sobres?|filetes?)\s+(?:de\s+)?([^,\.]+)/i';

        if (preg_match_all($patronIngrediente, $descripcion, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $ingredientes[] = trim($match[0]);
            }
        }

        return $ingredientes;
    }

    /**
     * Verificar si una línea parece un item de comida
     */
    private function esItemComida($linea)
    {
        // Patrones que indican un item de comida
        $patronesComida = [
            '/^\d+\s*(g|gr|gramos|ml|oz|cdas?|cucharadas?|tazas?|piezas?|rebanadas?|porciones?)/i',
            '/^\*\s/',
            '/^-\s/',
            '/^•\s/',
            '/^\d+\/\d+/',  // Fracciones como 1/2
            '/^(leche|pan|huevo|fruta|verdura|carne|pollo|pescado|arroz|frijol|tortilla)/i',
        ];

        foreach ($patronesComida as $patron) {
            if (preg_match($patron, $linea)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar si una línea es un encabezado (versión mejorada)
     */
    private function esEncabezadoMejorado($linea)
    {
        $encabezados = [
            'desayuno', 'almuerzo', 'cena', 'merienda', 'snack', 'colacion', 'comida',
            'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
            'horario', 'opcion', 'opción'
        ];

        foreach ($encabezados as $enc) {
            if (strpos($linea, $enc) !== false && strlen($linea) < 50) {
                return true;
            }
        }

        // También es encabezado si empieza con "Opción X:"
        if (preg_match('/^opci[oó]n\s*\d+/i', $linea)) {
            return true;
        }

        return false;
    }

    /**
     * Verificar si una línea es un encabezado (legacy)
     */
    private function esEncabezado($linea)
    {
        return $this->esEncabezadoMejorado($linea);
    }

    /**
     * Insertar comidas del plan en la tabla
     */
    private function insertarComidasPlan($planId, $comidas)
    {
        $orden = 0;
        foreach ($comidas as $comida) {
            $this->db->query(
                "INSERT INTO plan_comidas
                 (plan_id, dia_semana, tipo_comida, nombre_plato, descripcion, ingredientes,
                  calorias, proteinas_g, carbohidratos_g, grasas_g, orden)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $planId,
                    $comida['dia_semana'] ?? 'lunes',
                    $comida['tipo_comida'] ?? 'almuerzo',
                    $comida['nombre_plato'] ?? 'Comida',
                    $comida['descripcion'] ?? '',
                    json_encode($comida['ingredientes'] ?? []),
                    $comida['calorias'] ?? 0,
                    $comida['proteinas_g'] ?? 0,
                    $comida['carbohidratos_g'] ?? 0,
                    $comida['grasas_g'] ?? 0,
                    $orden++
                ]
            );
        }
    }

    /**
     * Actualizar contenido JSON del plan manualmente
     */
    public function updatePlanContent($planId)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['contenido'])) {
            return Response::error('Contenido requerido', 400);
        }

        // Actualizar plan
        $this->db->query(
            "UPDATE planes_nutricionales SET
             contenido_json = ?,
             calorias_diarias = ?,
             proteinas_g = ?,
             carbohidratos_g = ?,
             grasas_g = ?,
             updated_at = NOW()
             WHERE id = ?",
            [
                json_encode($data['contenido']),
                $data['contenido']['totales']['calorias'] ?? null,
                $data['contenido']['totales']['proteinas'] ?? null,
                $data['contenido']['totales']['carbohidratos'] ?? null,
                $data['contenido']['totales']['grasas'] ?? null,
                $planId
            ]
        );

        // Eliminar comidas anteriores y reinsertar
        $this->db->query("DELETE FROM plan_comidas WHERE plan_id = ?", [$planId]);

        if (!empty($data['contenido']['comidas'])) {
            $this->insertarComidasPlan($planId, $data['contenido']['comidas']);
        }

        return Response::success(null, 'Plan actualizado exitosamente');
    }

    /**
     * Obtener planes del especialista
     */
    public function getPlanesEspecialista($especialistaId)
    {
        $planes = $this->db->query(
            "SELECT pn.*,
                    (SELECT COUNT(*) FROM planes_nutricionales_paciente WHERE plan_id = pn.id AND activo = 1) as pacientes_asignados
             FROM planes_nutricionales pn
             WHERE pn.especialista_id = ?
             ORDER BY pn.created_at DESC",
            [$especialistaId]
        )->fetchAll();

        // Decodificar JSON
        foreach ($planes as &$plan) {
            $plan['contenido'] = json_decode($plan['contenido_json'], true);
            unset($plan['contenido_json']);
        }

        return Response::success(['planes' => $planes]);
    }

    /**
     * Obtener detalle de un plan
     */
    public function getPlan($planId)
    {
        $plan = $this->db->query(
            "SELECT * FROM planes_nutricionales WHERE id = ?",
            [$planId]
        )->fetch();

        if (!$plan) {
            return Response::error('Plan no encontrado', 404);
        }

        // Obtener comidas
        $comidas = $this->db->query(
            "SELECT * FROM plan_comidas WHERE plan_id = ? ORDER BY
             FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
             FIELD(tipo_comida, 'desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena', 'snack'),
             orden",
            [$planId]
        )->fetchAll();

        // Obtener pacientes asignados
        $pacientes = $this->db->query(
            "SELECT pnp.*, u.nombre_completo, u.email
             FROM planes_nutricionales_paciente pnp
             INNER JOIN pacientes p ON pnp.paciente_id = p.id
             INNER JOIN usuarios u ON p.usuario_id = u.id
             WHERE pnp.plan_id = ?",
            [$planId]
        )->fetchAll();

        $plan['contenido'] = json_decode($plan['contenido_json'], true);
        unset($plan['contenido_json']);
        $plan['comidas'] = $comidas;
        $plan['pacientes_asignados'] = $pacientes;

        return Response::success($plan);
    }

    /**
     * Asignar plan a paciente
     */
    public function asignarPlan($planId)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['paciente_id']) || !isset($data['especialista_id'])) {
            return Response::error('Paciente y especialista requeridos', 400);
        }

        // Desactivar planes anteriores del paciente
        $this->db->query(
            "UPDATE planes_nutricionales_paciente SET activo = 0 WHERE paciente_id = ?",
            [$data['paciente_id']]
        );

        // Asignar nuevo plan
        $this->db->query(
            "INSERT INTO planes_nutricionales_paciente
             (plan_id, paciente_id, especialista_id, notas_personalizadas, fecha_inicio, activo)
             VALUES (?, ?, ?, ?, ?, 1)",
            [
                $planId,
                $data['paciente_id'],
                $data['especialista_id'],
                $data['notas'] ?? null,
                $data['fecha_inicio'] ?? date('Y-m-d')
            ]
        );

        $asignacionId = $this->db->lastInsertId();

        // Activar el plan si estaba en borrador
        $this->db->query(
            "UPDATE planes_nutricionales SET estado = 'activo' WHERE id = ? AND estado = 'borrador'",
            [$planId]
        );

        return Response::success(['asignacion_id' => $asignacionId], 'Plan asignado exitosamente');
    }

    /**
     * Obtener plan activo del paciente
     */
    public function getPlanPaciente($pacienteId)
    {
        $asignacion = $this->db->query(
            "SELECT pnp.*, pn.nombre, pn.descripcion, pn.contenido_json, pn.calorias_diarias,
                    pn.proteinas_g, pn.carbohidratos_g, pn.grasas_g,
                    u.nombre_completo as especialista_nombre
             FROM planes_nutricionales_paciente pnp
             INNER JOIN planes_nutricionales pn ON pnp.plan_id = pn.id
             INNER JOIN usuarios u ON pnp.especialista_id = u.id
             WHERE pnp.paciente_id = ? AND pnp.activo = 1
             LIMIT 1",
            [$pacienteId]
        )->fetch();

        if (!$asignacion) {
            return Response::success([
                'tiene_plan' => false,
                'mensaje' => 'No tienes un plan nutricional asignado aún'
            ]);
        }

        // Obtener comidas del plan (con datos de recetas si tienen receta_id)
        $comidas = $this->db->query(
            "SELECT pc.*, r.titulo AS receta_titulo, r.imagen_url AS receta_imagen,
                    r.ingredientes AS receta_ingredientes, r.instrucciones AS receta_instrucciones,
                    r.tiempo_preparacion AS receta_tiempo
             FROM plan_comidas pc
             LEFT JOIN recetas r ON pc.receta_id = r.id
             WHERE pc.plan_id = ?
             ORDER BY FIELD(pc.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
             FIELD(pc.tipo_comida, 'desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena', 'snack'),
             pc.orden",
            [$asignacion['plan_id']]
        )->fetchAll();

        // Decodificar JSON de recetas en cada comida
        foreach ($comidas as &$comida) {
            if (!empty($comida['receta_ingredientes'])) {
                $comida['receta_ingredientes'] = json_decode($comida['receta_ingredientes'], true);
            }
            if (!empty($comida['receta_instrucciones'])) {
                $comida['receta_instrucciones'] = json_decode($comida['receta_instrucciones'], true);
            }
            if (!empty($comida['ingredientes']) && is_string($comida['ingredientes'])) {
                $comida['ingredientes'] = json_decode($comida['ingredientes'], true);
            }
            if (!empty($comida['instrucciones_json']) && is_string($comida['instrucciones_json'])) {
                $comida['instrucciones_json'] = json_decode($comida['instrucciones_json'], true);
            }
        }
        unset($comida);

        // Obtener seguimiento del día actual
        $hoy = date('Y-m-d');
        $seguimiento = $this->db->query(
            "SELECT * FROM seguimiento_plan_nutricional
             WHERE asignacion_id = ? AND fecha = ?",
            [$asignacion['id'], $hoy]
        )->fetchAll();

        $asignacion['contenido'] = json_decode($asignacion['contenido_json'], true);
        unset($asignacion['contenido_json']);
        $asignacion['comidas'] = $comidas;
        $asignacion['seguimiento_hoy'] = $seguimiento;
        $asignacion['tiene_plan'] = true;

        return Response::success($asignacion);
    }

    /**
     * Registrar seguimiento de comida
     */
    public function registrarSeguimiento($pacienteId)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['asignacion_id']) || !isset($data['tipo_comida'])) {
            return Response::error('Datos requeridos', 400);
        }

        $this->db->query(
            "INSERT INTO seguimiento_plan_nutricional
             (asignacion_id, paciente_id, fecha, comida_id, tipo_comida, cumplido, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE cumplido = ?, notas = ?",
            [
                $data['asignacion_id'],
                $pacienteId,
                $data['fecha'] ?? date('Y-m-d'),
                $data['comida_id'] ?? null,
                $data['tipo_comida'],
                $data['cumplido'] ? 1 : 0,
                $data['notas'] ?? null,
                $data['cumplido'] ? 1 : 0,
                $data['notas'] ?? null
            ]
        );

        return Response::success(null, 'Seguimiento registrado');
    }

    /**
     * Eliminar plan
     */
    public function deletePlan($planId)
    {
        // Verificar que no tenga pacientes activos
        $activos = $this->db->query(
            "SELECT COUNT(*) as total FROM planes_nutricionales_paciente WHERE plan_id = ? AND activo = 1",
            [$planId]
        )->fetch();

        if ($activos['total'] > 0) {
            return Response::error('No se puede eliminar un plan con pacientes activos', 400);
        }

        $this->db->query("DELETE FROM planes_nutricionales WHERE id = ?", [$planId]);

        return Response::success(null, 'Plan eliminado');
    }

    /**
     * Verificar si un comando existe en el sistema
     */
    private function commandExists($cmd)
    {
        // Detectar sistema operativo
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows: usar where
            $return = shell_exec(sprintf("where %s 2>NUL", escapeshellarg($cmd)));
        } else {
            // Unix/Linux/Mac: usar which
            $return = shell_exec(sprintf("which %s 2>/dev/null", escapeshellarg($cmd)));
        }
        return !empty($return);
    }

    /**
     * Sanitizar array recursivamente para asegurar UTF-8 válido
     */
    private function sanitizeArrayUtf8($data)
    {
        if (is_array($data)) {
            $result = [];
            foreach ($data as $key => $value) {
                $cleanKey = is_string($key) ? $this->sanitizeUtf8($key) : $key;
                $result[$cleanKey] = $this->sanitizeArrayUtf8($value);
            }
            return $result;
        } elseif (is_string($data)) {
            return $this->sanitizeUtf8($data);
        }
        return $data;
    }

    /**
     * Sanitizar texto a UTF-8 válido
     */
    private function sanitizeUtf8($text)
    {
        if (empty($text)) {
            return '';
        }

        // Intentar detectar y convertir encoding
        $encoding = mb_detect_encoding($text, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII'], true);

        if ($encoding && $encoding !== 'UTF-8') {
            $text = mb_convert_encoding($text, 'UTF-8', $encoding);
        }

        // Eliminar caracteres no válidos de UTF-8
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);

        // Asegurar UTF-8 válido
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');

        // Si aún hay problemas, forzar limpieza
        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = iconv('UTF-8', 'UTF-8//IGNORE', $text);
        }

        return $text ?: '';
    }

    /**
     * Detectar el formato del plan nutricional basándose en el texto extraído
     */
    private function detectarFormatoPlan($texto)
    {
        // --- Check for "equivalentes" format ---
        $keywordsEquiv = [
            'Cuadro de Equivalentes',
            'Grupo de Alimentos',
            'PROTEINAS 1',
            'Proteínas 1',
            'Leguminosas',
            'Grasas con prote',
            'ALIMENTOS LIBRES',
            'Alimentos Libres',
            'EQUIVALENTE',
            'ALIMENTO EQUIVALENTE'
        ];

        $scoreEquiv = 0;
        foreach ($keywordsEquiv as $kw) {
            if (mb_stripos($texto, $kw) !== false) {
                $scoreEquiv++;
            }
        }

        if ($scoreEquiv >= 3) {
            return 'equivalentes';
        }

        // --- Check for "recetas" format (recipe cards with ingredients + preparation) ---
        $keywordsRecetas = [
            'Recetas para',
            'Opción 1',
            'Opci\u00f3n 1',
            'Ingredientes',
            'Preparación',
            'Preparacion',
            'pieza ',
            'cucharada ',
            'cucharadita ',
        ];

        $scoreRecetas = 0;
        foreach ($keywordsRecetas as $kw) {
            if (mb_stripos($texto, $kw) !== false) {
                $scoreRecetas++;
            }
        }

        // Also check for the specific pattern of "Opción N" + "Ingredientes" near each other
        if (preg_match('/Opci[oó]n\s*\d/iu', $texto) && mb_stripos($texto, 'Ingredientes') !== false) {
            $scoreRecetas += 2;
        }

        // Check for numbered preparation steps like "1.Guisa" or "1. Mezcla"
        if (preg_match('/\d+\.\s*[A-ZÁÉÍÓÚÑ]/u', $texto)) {
            $scoreRecetas++;
        }

        if ($scoreRecetas >= 4) {
            return 'recetas';
        }

        return 'clasico';
    }

    /**
     * Procesar texto con formato de recetas (Ingredientes + Preparación por tiempo de comida)
     * Output compatible with VistaPlan.jsx: comidas[] → opciones[] → ingredientes[], instrucciones[]
     *
     * The PDF text from pdf.js uses:
     * - "|||" to separate left/right columns (ingredients vs preparation)
     * - "---PAGE_BREAK---" between pages
     */
    private function procesarTextoRecetas($texto)
    {
        $resultado = [
            'generado_con_catalogo' => true, // triggers VistaPlan.jsx rendering
            'tipo_formato' => 'recetas',
            'titulo' => '',
            'paciente' => '',
            'fecha' => '',
            'especialista' => '',
            'cedula' => '',
            'indicaciones_generales' => [],
            'totales' => [
                'calorias' => 0,
                'proteinas' => 0,
                'carbohidratos' => 0,
                'grasas' => 0
            ],
            'comidas' => [],
            'texto_original' => $texto
        ];

        if (empty($texto)) {
            return $resultado;
        }

        try {
            // --- Step 1: Extract header info from first occurrence ---
            if (preg_match('/L\.?\s*N\.?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s\.]+?)(?=\s{2,}|C[eé]dula|\|{3}|$)/u', $texto, $m)) {
                $resultado['especialista'] = trim($m[1]);
            }
            if (preg_match('/C[eé]dula\s+profesional[:\s]*(\d+)/iu', $texto, $m)) {
                $resultado['cedula'] = trim($m[1]);
            }
            if (preg_match('/Paciente[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]+?)(?=\s{2,}|Plan\s+asignado|\|{3}|$)/u', $texto, $m)) {
                $resultado['paciente'] = trim($m[1]);
            }
            if (preg_match('/Plan\s+asignado[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/iu', $texto, $m)) {
                $resultado['fecha'] = trim($m[1]);
            }

            // --- Step 2: Clean the text - remove repeated page headers ---
            $texto = $this->limpiarHeadersPagina($texto);

            // --- Step 3: Find all option blocks ---
            // Each option block starts with a line containing "Opción N" and "Ingredientes"
            // or simply "Opción N"
            $bloques = $this->encontrarBloquesOpcion($texto);

            // --- Step 4: Group by meal type and build comidas array ---
            $comidasMap = []; // tipo_comida => opciones[]

            foreach ($bloques as $bloque) {
                $tipo = $bloque['tipo_comida'];
                if (!isset($comidasMap[$tipo])) {
                    $comidasMap[$tipo] = [];
                }
                $comidasMap[$tipo][] = $bloque['opcion'];
            }

            // Build final comidas array in order
            $ordenComidas = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'];
            foreach ($ordenComidas as $tipo) {
                if (isset($comidasMap[$tipo]) && !empty($comidasMap[$tipo])) {
                    $resultado['comidas'][] = [
                        'dia_semana' => 'lunes',
                        'tipo_comida' => $tipo,
                        'opciones' => $comidasMap[$tipo],
                        'calorias' => 0,
                        'proteinas_g' => 0,
                        'carbohidratos_g' => 0,
                        'grasas_g' => 0
                    ];
                }
            }

        } catch (\Exception $e) {
            error_log('Error en procesarTextoRecetas: ' . $e->getMessage());
        }

        return $resultado;
    }

    /**
     * Remove repeated page headers from the extracted text.
     * Headers typically contain: specialist name, cédula, paciente, date.
     * They repeat on every page.
     */
    private function limpiarHeadersPagina($texto)
    {
        $lineas = preg_split('/\r?\n/', $texto);
        $resultado = [];

        for ($i = 0; $i < count($lineas); $i++) {
            $linea = $lineas[$i];
            $lineaTrim = trim($linea);

            // Skip page break markers (we don't need them after cleaning)
            if ($lineaTrim === '---PAGE_BREAK---') {
                continue;
            }

            // Skip lines containing "L. N." + "Cédula" (specialist header line)
            if (preg_match('/L\.?\s*N\./i', $lineaTrim) && preg_match('/C[eé]dula|profesional/iu', $lineaTrim)) {
                continue;
            }

            // Skip lines that contain a cedula number (5+ digits) AND a date (d/d/yyyy)
            // These are the continuation of page headers: "Reséndiz    11460299    María..."
            if (preg_match('/\d{5,}/', $lineaTrim) && preg_match('/\d{1,2}\/\d{1,2}\/\d{2,4}/', $lineaTrim)) {
                continue;
            }

            // Skip standalone "Recetas para<MealType>" lines (section markers we don't need)
            if (preg_match('/^Recetas\s*para/iu', $lineaTrim) && mb_strlen($lineaTrim) < 50) {
                continue;
            }

            // Skip lines that are ONLY "Preparación" or "Ingredientes" (column headers)
            if (preg_match('/^(Preparaci[oó]n|Ingredientes)$/iu', $lineaTrim)) {
                continue;
            }

            $resultado[] = $linea;
        }

        return implode("\n", $resultado);
    }

    /**
     * Find all option blocks in the cleaned text.
     * Returns array of: ['tipo_comida' => string, 'opcion' => array]
     */
    private function encontrarBloquesOpcion($texto)
    {
        $bloques = [];
        $lineas = preg_split('/\r?\n/', $texto);

        // State tracking
        $tipoComidaActual = null;
        $opcionActual = null;
        $ingredientesActual = [];
        $instruccionesActual = [];
        $nombreRecetaActual = '';
        $lineasSobrantes = [];
        $enOpcion = false;

        // Patterns
        $unidades = 'piezas?|tazas?|cucharadas?|cucharaditas?|rebanadas?|gramos?|g(?=\s|$)|gr(?=\s|$)|ml(?=\s|$)|litros?|sobres?|latas?|vasos?|paquetes?|barras?|onzas?|cdas?|cdtas?|tz(?=\s|$)|porci[oó]n(?:es)?|racimos?';
        $patronIngrediente = '/^(\d+(?:\/\d+)?(?:\s*[½¼¾⅓⅔⅛])?|[½¼¾⅓⅔⅛])\s+(' . $unidades . ')\s+(.+)/iu';
        $patronPreparacion = '/^(\d+)\.\s*([A-ZÁÉÍÓÚÑ].*)/u';

        for ($i = 0; $i < count($lineas); $i++) {
            $linea = trim($lineas[$i]);
            if (empty($linea)) continue;

            // Detect meal type + option header line
            // e.g. "Desayuno    Opción 1    Ingredientes"  or  "Desayuno    Opción 2    Ingredientes"
            if (preg_match('/^(Desayuno|Comida|Cena|Colaci[oó]n\s*\d)\s+.*?Opci[oó]n\s*(\d+)/iu', $linea, $headerM)) {
                // Save previous option if exists
                if ($enOpcion) {
                    $this->guardarOpcionReceta($bloques, $tipoComidaActual, $opcionActual, $ingredientesActual, $instruccionesActual, $lineasSobrantes);
                }

                // Start new option
                $tipoComidaActual = $this->normalizarTipoComida($headerM[1]);
                $opcionActual = (int)$headerM[2];
                $ingredientesActual = [];
                $instruccionesActual = [];
                $lineasSobrantes = [];
                $enOpcion = true;
                continue;
            }

            // Also detect simpler pattern: just "Opción N" on its own line or with "Ingredientes"
            if (preg_match('/^Opci[oó]n\s*(\d+)/iu', $linea, $opM) && !preg_match('/^\d+\s+(' . $unidades . ')/iu', $linea)) {
                // Save previous option if exists
                if ($enOpcion) {
                    $this->guardarOpcionReceta($bloques, $tipoComidaActual, $opcionActual, $ingredientesActual, $instruccionesActual, $lineasSobrantes);
                }

                $opcionActual = (int)$opM[1];
                $ingredientesActual = [];
                $instruccionesActual = [];
                $lineasSobrantes = [];
                $enOpcion = true;
                continue;
            }

            if (!$enOpcion) continue;

            // Process line content within an option block
            // The line may have "|||" separator from two-column layout: "ingredient ||| preparation"
            $partes = preg_split('/\s*\|{3}\s*/', $linea, 2);
            $parteIzq = trim($partes[0] ?? '');
            $parteDer = isset($partes[1]) ? trim($partes[1]) : '';

            // Process left part (usually ingredients)
            if (!empty($parteIzq)) {
                if (preg_match($patronIngrediente, $parteIzq, $ingM)) {
                    $ingredientesActual[] = trim($ingM[1]) . ' ' . trim($ingM[2]) . ' ' . trim($ingM[3]);
                } elseif (preg_match($patronPreparacion, $parteIzq, $prepM)) {
                    $instruccionesActual[] = trim($prepM[2]);
                } elseif (!empty($instruccionesActual) && preg_match('/^[a-záéíóúñ]/u', $parteIzq)) {
                    // Continuation of previous instruction
                    $instruccionesActual[count($instruccionesActual) - 1] .= ' ' . $parteIzq;
                } elseif ($this->esLineaRecetaNombre($parteIzq)) {
                    $lineasSobrantes[] = $parteIzq;
                }
            }

            // Process right part (usually preparation steps)
            if (!empty($parteDer)) {
                if (preg_match($patronPreparacion, $parteDer, $prepM)) {
                    $instruccionesActual[] = trim($prepM[2]);
                } elseif (!empty($instruccionesActual) && (
                    preg_match('/^[a-záéíóúñ]/u', $parteDer) ||
                    preg_match('/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/', $parteDer)
                )) {
                    // Continuation of previous instruction
                    $instruccionesActual[count($instruccionesActual) - 1] .= ' ' . $parteDer;
                } elseif (preg_match($patronIngrediente, $parteDer, $ingM)) {
                    // Sometimes ingredients appear on the right too
                    $ingredientesActual[] = trim($ingM[1]) . ' ' . trim($ingM[2]) . ' ' . trim($ingM[3]);
                }
            }
        }

        // Save last option
        if ($enOpcion) {
            $this->guardarOpcionReceta($bloques, $tipoComidaActual, $opcionActual, $ingredientesActual, $instruccionesActual, $lineasSobrantes);
        }

        return $bloques;
    }

    /**
     * Save a parsed option into the bloques array
     */
    private function guardarOpcionReceta(&$bloques, $tipoComida, $numOpcion, $ingredientes, $instrucciones, $lineasSobrantes)
    {
        if (empty($ingredientes) && empty($instrucciones)) return;

        // Recipe name = last sobrante line that looks like a name
        $nombreReceta = '';
        if (!empty($lineasSobrantes)) {
            $nombreReceta = end($lineasSobrantes);
        }

        $bloques[] = [
            'tipo_comida' => $tipoComida ?? 'almuerzo',
            'opcion' => [
                'numero' => $numOpcion ?? 1,
                'nombre' => $nombreReceta ?: ('Opción ' . ($numOpcion ?? 1)),
                'descripcion' => '',
                'calorias' => 0,
                'proteinas' => 0,
                'carbohidratos' => 0,
                'grasas' => 0,
                'ingredientes' => $ingredientes,
                'instrucciones' => $instrucciones,
                'imagen_url' => null
            ]
        ];
    }

    /**
     * Check if a line looks like a recipe name (not ingredient, not step, not header)
     */
    private function esLineaRecetaNombre($linea)
    {
        $linea = trim($linea);

        // Too short or too long
        if (mb_strlen($linea) < 4 || mb_strlen($linea) > 80) return false;

        // Starts with a number (ingredient or step)
        if (preg_match('/^\d/', $linea)) return false;

        // Is a known header keyword
        if (preg_match('/^(Opci[oó]n|Ingredientes|Preparaci[oó]n|Desayuno|Comida|Cena|Colaci[oó]n|Recetas|L\.?\s*N\.|C[eé]dula|Paciente|Plan\s+asignado)/iu', $linea)) {
            return false;
        }

        // Contains cedula-like numbers or dates (page header debris)
        if (preg_match('/\d{5,}/', $linea)) return false;
        if (preg_match('/\d{1,2}\/\d{1,2}\/\d{2,4}/', $linea)) return false;

        // Must contain at least 2 letters
        if (!preg_match('/[a-záéíóúñ]{2,}/iu', $linea)) return false;

        return true;
    }

    /**
     * Normalize meal type name to internal key
     */
    private function normalizarTipoComida($nombre)
    {
        $n = mb_strtolower(trim($nombre));
        $n = str_replace(['á','é','í','ó','ú'], ['a','e','i','o','u'], $n);

        if (strpos($n, 'desayuno') !== false) return 'desayuno';
        if (preg_match('/colacion\s*1/', $n)) return 'media_manana';
        if (strpos($n, 'comida') !== false) return 'almuerzo';
        if (preg_match('/colacion\s*2/', $n)) return 'merienda';
        if (strpos($n, 'cena') !== false) return 'cena';

        return 'almuerzo';
    }

    /**
     * Procesar texto extraído de un plan con formato de Sistema de Equivalentes
     */
    private function procesarTextoEquivalentes($texto)
    {
        $resultado = [
            'tipo' => 'equivalentes',
            'datos_paciente' => [
                'nombre' => '',
                'peso' => '',
                'grasa_corporal' => '',
                'masa_muscular' => '',
                'objetivo' => ''
            ],
            'especialista' => [
                'nombre' => '',
                'titulo' => '',
                'email' => ''
            ],
            'cuadro_equivalentes' => [
                'tiempos' => ['Desayuno', 'Colación 1', 'Comida', 'Colación 2', 'Cena'],
                'grupos' => []
            ],
            'grupos_alimentos' => [],
            'alimentos_libres' => [
                'moderados' => [],
                'libres' => []
            ],
            'recomendaciones' => [],
            'totales' => [
                'calorias' => 0,
                'proteinas' => 0,
                'carbohidratos' => 0,
                'grasas' => 0
            ],
            'comidas' => [],
            'texto_original' => $texto
        ];

        if (empty($texto)) {
            return $resultado;
        }

        try {
            // --- Datos del paciente ---
            // Patterns work for both line-based (pdftotext) and concatenated (PHP native) text
            if (preg_match('/PLAN DE ALIMENTACI[ÓO]N\s+(.+?)(?=\s*PESO\b|\s*%\s*Grasa|\n)/isu', $texto, $m)) {
                $resultado['datos_paciente']['nombre'] = trim($m[1]);
            }
            if (preg_match('/PESO[:\s]*([\d.,]+\s*(?:kg|lb|libras)?)/i', $texto, $m)) {
                $resultado['datos_paciente']['peso'] = trim($m[1]);
            }
            if (preg_match('/%\s*Grasa(?:\s+corporal)?[:\s]*([\d.,]+\s*%?)/i', $texto, $m)) {
                $resultado['datos_paciente']['grasa_corporal'] = trim($m[1]);
            }
            if (preg_match('/Masa muscular[:\s]*([\d.,]+\s*(?:kg|lb)?)/i', $texto, $m)) {
                $resultado['datos_paciente']['masa_muscular'] = trim($m[1]);
            }
            if (preg_match('/Objetivo[:\s]*(.+?)(?=\s*Cuadro|\s*Grupo de Alimentos|\s*L\.N\.|\s*Cereales|\n\n)/isu', $texto, $m)) {
                $resultado['datos_paciente']['objetivo'] = trim($m[1]);
            }

            // --- Datos del especialista ---
            if (preg_match('/L\.N\.\s+(.+?)(?=\s*Licenciada|\s*Especialista|\s*nutri_|\n)/isu', $texto, $m)) {
                $resultado['especialista']['nombre'] = 'L.N. ' . trim($m[1]);
            }
            if (preg_match('/Licenciada en Nutrici[oó]n.+?(?=\s*nutri_|\s*[\w.-]+@|\n|$)/iu', $texto, $m)) {
                $resultado['especialista']['titulo'] = trim($m[0]);
            }
            if (preg_match('/[\w.-]+@[\w.-]+\.\w+/i', $texto, $m)) {
                $resultado['especialista']['email'] = trim($m[0]);
            }

            // --- Cuadro de Equivalentes ---
            $resultado['cuadro_equivalentes']['grupos'] = $this->parsearCuadroEquivalentes($texto);

            // --- Grupos de alimentos ---
            $resultado['grupos_alimentos'] = $this->parsearGruposAlimentos($texto);

            // --- Alimentos libres ---
            $resultado['alimentos_libres'] = $this->parsearAlimentosLibres($texto);

            // --- Recomendaciones ---
            $resultado['recomendaciones'] = $this->parsearRecomendaciones($texto);

        } catch (\Exception $e) {
            error_log('Error en procesarTextoEquivalentes: ' . $e->getMessage());
        }

        return $resultado;
    }

    /**
     * Parsear el Cuadro de Equivalentes del plan
     */
    private function parsearCuadroEquivalentes($texto)
    {
        $grupos = [];

        // Method 0: Parse ||| separated format (e.g. "Verduras ||| 2 ||| - ||| 2 ||| - ||| 1")
        if (mb_strpos($texto, '|||') !== false) {
            $grupos = $this->parsearCuadroPorSeparador($texto);
            if (!empty($grupos)) return $grupos;
        }

        // Definir los grupos esperados y sus patrones (whitespace-separated)
        $gruposPatrones = [
            'Verduras' => '/Verduras\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Frutas' => '/Frutas\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Cereales' => '/Cereales\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Leguminosas' => '/Leguminosas\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Proteínas 1' => '/Prote[ií]nas\s*1\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Proteínas 2' => '/Prote[ií]nas\s*2\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Proteínas 3' => '/Prote[ií]nas\s*3\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Lácteos' => '/L[aá]cteos\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Grasas' => '/(?<!con\s)Grasas\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i',
            'Grasas con proteína' => '/Grasas\s+con\s+prote[ií]na\s+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)[\s]+([\d.,]+|-)/i'
        ];

        foreach ($gruposPatrones as $nombre => $patron) {
            if (preg_match($patron, $texto, $m)) {
                $equivalentes = [];
                for ($i = 1; $i <= 5; $i++) {
                    $val = trim($m[$i]);
                    if ($val === '-' || $val === '') {
                        $equivalentes[] = 0;
                    } else {
                        $equivalentes[] = (float) str_replace(',', '.', $val);
                    }
                }
                $grupos[] = [
                    'nombre' => $nombre,
                    'equivalentes' => $equivalentes
                ];
            }
        }

        // Si el regex no capturó, intentar parseo por líneas en la zona del cuadro
        if (empty($grupos)) {
            $grupos = $this->parsearCuadroPorLineas($texto);
        }

        return $grupos;
    }

    /**
     * Parse cuadro from ||| separated format
     * e.g. "Verduras ||| 2 ||| - ||| 2 ||| - ||| 1"
     */
    private function parsearCuadroPorSeparador($texto)
    {
        $grupos = [];
        $nombresGrupos = [
            'verduras' => 'Verduras',
            'frutas' => 'Frutas',
            'cereales' => 'Cereales',
            'leguminosas' => 'Leguminosas',
            'proteínas 1' => 'Proteínas 1', 'proteinas 1' => 'Proteínas 1',
            'proteínas 2' => 'Proteínas 2', 'proteinas 2' => 'Proteínas 2',
            'proteínas 3' => 'Proteínas 3', 'proteinas 3' => 'Proteínas 3',
            'lácteos' => 'Lácteos', 'lacteos' => 'Lácteos',
            'grasas con proteína' => 'Grasas con proteína',
            'grasas con proteina' => 'Grasas con proteína',
            'grasas con' => 'Grasas con proteína',
            'grasas' => 'Grasas',
        ];
        $yaAgregados = [];

        $lineas = preg_split('/\r?\n/', $texto);
        foreach ($lineas as $linea) {
            $lineaClean = trim($linea);
            if (mb_strpos($lineaClean, '|||') === false) continue;

            $parts = array_map('trim', explode('|||', $lineaClean));
            if (count($parts) < 2) continue;

            $nombreRaw = mb_strtolower(trim($parts[0]));
            $nombreBonito = null;

            // Match longest key first (grasas con proteína before grasas)
            foreach ($nombresGrupos as $key => $bonito) {
                if (mb_strpos($nombreRaw, $key) !== false) {
                    // Avoid matching "grasas" when it's "grasas con"
                    if ($key === 'grasas' && mb_strpos($nombreRaw, 'grasas con') !== false) continue;
                    $nombreBonito = $bonito;
                    break;
                }
            }

            if (!$nombreBonito || isset($yaAgregados[$nombreBonito])) continue;

            $equivalentes = [];
            for ($i = 1; $i < count($parts) && count($equivalentes) < 5; $i++) {
                $val = trim($parts[$i]);
                if ($val === '-' || $val === '') {
                    $equivalentes[] = 0;
                } else {
                    $equivalentes[] = (float) str_replace(',', '.', $val);
                }
            }
            // Pad to 5 columns
            while (count($equivalentes) < 5) $equivalentes[] = 0;

            $grupos[] = ['nombre' => $nombreBonito, 'equivalentes' => $equivalentes];
            $yaAgregados[$nombreBonito] = true;
        }

        return $grupos;
    }

    /**
     * Fallback: parse cuadro de equivalentes by lines or from concatenated text
     */
    private function parsearCuadroPorLineas($texto)
    {
        $grupos = [];

        // ---- Method 1: Line-based ----
        $lineas = preg_split('/\r?\n/', $texto);
        $enCuadro = false;
        $nombresGrupos = [
            'verduras', 'frutas', 'cereales', 'leguminosas',
            'proteínas 1', 'proteinas 1', 'proteínas 2', 'proteinas 2',
            'proteínas 3', 'proteinas 3', 'lácteos', 'lacteos',
            'grasas con', 'grasas'
        ];

        foreach ($lineas as $linea) {
            $lineaClean = trim($linea);
            $lineaLower = mb_strtolower($lineaClean);

            if (mb_strpos($lineaLower, 'grupo de') !== false && mb_strpos($lineaLower, 'alimentos') !== false) {
                $enCuadro = true;
                continue;
            }

            if ($enCuadro && mb_strlen($lineaClean) > 100) {
                $enCuadro = false;
            }

            if (!$enCuadro) continue;

            foreach ($nombresGrupos as $nombreGrupo) {
                if (mb_strpos($lineaLower, $nombreGrupo) !== false) {
                    if (preg_match_all('/([\d.,]+|-)\s+/', $lineaClean . ' ', $numMatches)) {
                        $vals = $numMatches[1];
                        if (count($vals) >= 5) {
                            $equivalentes = [];
                            for ($i = 0; $i < 5; $i++) {
                                $v = trim($vals[$i]);
                                $equivalentes[] = ($v === '-') ? 0 : (float) str_replace(',', '.', $v);
                            }
                            $nombreBonito = $this->normalizarNombreGrupo($nombreGrupo);
                            $grupos[] = ['nombre' => $nombreBonito, 'equivalentes' => $equivalentes];
                            break;
                        }
                    }
                }
            }
        }

        if (!empty($grupos)) return $grupos;

        // ---- Method 2: Concatenated text - use group names as anchors ----
        $textoNorm = preg_replace('/\s+/', ' ', $texto);
        $grupoAnchors = [
            ['nombre' => 'Verduras', 'patron' => '/Verduras\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Frutas', 'patron' => '/Frutas\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Cereales', 'patron' => '/Cereales\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Leguminosas', 'patron' => '/Leguminosas\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Proteínas 1', 'patron' => '/Prote[ií]nas\s*1\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Proteínas 2', 'patron' => '/Prote[ií]nas\s*2\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Proteínas 3', 'patron' => '/Prote[ií]nas\s*3\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Lácteos', 'patron' => '/L[aá]cteos\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Grasas', 'patron' => '/(?<!con\s)Grasas\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
            ['nombre' => 'Grasas con proteína', 'patron' => '/Grasas\s+con\s+prote[ií]na\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)\s+([\d.,]+|-)/i'],
        ];

        foreach ($grupoAnchors as $ga) {
            if (preg_match($ga['patron'], $textoNorm, $m)) {
                $equivalentes = [];
                for ($i = 1; $i <= 5; $i++) {
                    $v = trim($m[$i]);
                    $equivalentes[] = ($v === '-') ? 0 : (float) str_replace(',', '.', $v);
                }
                $grupos[] = ['nombre' => $ga['nombre'], 'equivalentes' => $equivalentes];
            }
        }

        return $grupos;
    }

    /**
     * Normalize a food group name to its display form
     */
    private function normalizarNombreGrupo($nombreGrupo)
    {
        $mapa = [
            'proteínas 1' => 'Proteínas 1', 'proteinas 1' => 'Proteínas 1',
            'proteínas 2' => 'Proteínas 2', 'proteinas 2' => 'Proteínas 2',
            'proteínas 3' => 'Proteínas 3', 'proteinas 3' => 'Proteínas 3',
            'grasas con' => 'Grasas con proteína',
            'lácteos' => 'Lácteos', 'lacteos' => 'Lácteos',
        ];
        return $mapa[$nombreGrupo] ?? ucfirst($nombreGrupo);
    }

    /**
     * Parsear las tablas de grupos de alimentos con sus equivalentes
     * Works with both line-based and concatenated text
     */
    private function parsearGruposAlimentos($texto)
    {
        $gruposResult = [];

        // Each food group table starts with the group name followed by "ALIMENTO" header
        // This pattern uniquely identifies food tables (not the cuadro de equivalentes rows)
        $seccionesConfig = [
            ['nombre' => 'Cereales', 'patron' => '/Cereales\s+ALIMENTO/iu'],
            ['nombre' => 'Verduras', 'patron' => '/Verduras\s+ALIMENTO/iu'],
            ['nombre' => 'Frutas', 'patron' => '/Frutas\s+ALIMENTO/iu'],
            ['nombre' => 'Proteínas 1', 'patron' => '/PROTE[ÍI]NAS\s*1\s+ALIMENTO/iu'],
            ['nombre' => 'Proteínas 2', 'patron' => '/PROTE[ÍI]NAS\s*2\s+ALIMENTO/iu'],
            ['nombre' => 'Proteínas 3', 'patron' => '/PROTE[ÍI]NAS\s*3\s+ALIMENTO/iu'],
            ['nombre' => 'Leguminosas', 'patron' => '/Leguminosas\s+ALIMENTO/iu'],
            ['nombre' => 'Grasas', 'patron' => '/GRASAS\s+ALIMENTO(?!\s*\w*\s*CON)/iu'],
            ['nombre' => 'Grasas con proteína', 'patron' => '/GRASAS\s+CON\s+PROTE[ÍI]NA\s+ALIMENTO/iu'],
            ['nombre' => 'Lácteos', 'patron' => '/L[ÁA]CTEOS\s+ALIMENTO/iu'],
        ];

        // Find positions of all section headers
        $secciones = [];
        foreach ($seccionesConfig as $config) {
            if (preg_match($config['patron'], $texto, $m, PREG_OFFSET_CAPTURE)) {
                $secciones[] = [
                    'nombre' => $config['nombre'],
                    'pos' => $m[0][1],
                    'headerEnd' => $m[0][1] + strlen($m[0][0])
                ];
            }
        }

        // Sort by position in text
        usort($secciones, fn($a, $b) => $a['pos'] - $b['pos']);

        // Extract content for each section
        for ($i = 0; $i < count($secciones); $i++) {
            $inicio = $secciones[$i]['headerEnd'];

            // End at next section, or at known end markers
            $fin = strlen($texto);
            if ($i + 1 < count($secciones)) {
                $fin = $secciones[$i + 1]['pos'];
            }

            // Also check for end markers that come before the next section
            foreach (['ALIMENTOS\s+LIBRES', 'RECOMENDACIONES'] as $endMarker) {
                if (preg_match('/' . $endMarker . '/iu', $texto, $mEnd, PREG_OFFSET_CAPTURE, $inicio)) {
                    if ($mEnd[0][1] < $fin) {
                        $fin = $mEnd[0][1];
                    }
                }
            }

            $seccionTexto = substr($texto, $inicio, $fin - $inicio);

            // Remove "EQUIVALENTE" header that follows "ALIMENTO"
            $seccionTexto = preg_replace('/^\s*EQUIVALENTE\s*/iu', '', $seccionTexto);

            $alimentos = $this->parsearTablaAlimentos($seccionTexto);

            if (!empty($alimentos)) {
                $gruposResult[] = [
                    'nombre' => $secciones[$i]['nombre'],
                    'alimentos' => $alimentos
                ];
            }
        }

        // Fallback: try original line-based approach if no sections found with "ALIMENTO" header
        if (empty($gruposResult)) {
            $gruposResult = $this->parsearGruposAlimentosFallback($texto);
        }

        return $gruposResult;
    }

    /**
     * Fallback: find food group sections using group names with \n markers
     */
    private function parsearGruposAlimentosFallback($texto)
    {
        $gruposResult = [];

        $secciones = [
            'Cereales' => ['inicio' => '/(?:^|\n)\s*Cereales\b/iu', 'fin' => '/(?:^|\n)\s*(?:Verduras|VERDURAS)\b/iu'],
            'Verduras' => ['inicio' => '/(?:^|\n)\s*Verduras\b/iu', 'fin' => '/(?:^|\n)\s*(?:Frutas|FRUTAS)\b/iu'],
            'Frutas' => ['inicio' => '/(?:^|\n)\s*Frutas\b/iu', 'fin' => '/(?:^|\n)\s*(?:PROTEINAS|Prote[ií]nas)\s*1/iu'],
            'Proteínas 1' => ['inicio' => '/(?:^|\n)\s*PROTE[ÍI]NAS\s*1/iu', 'fin' => '/(?:^|\n)\s*PROTE[ÍI]NAS\s*2/iu'],
            'Proteínas 2' => ['inicio' => '/(?:^|\n)\s*PROTE[ÍI]NAS\s*2/iu', 'fin' => '/(?:^|\n)\s*PROTE[ÍI]NAS\s*3/iu'],
            'Proteínas 3' => ['inicio' => '/(?:^|\n)\s*PROTE[ÍI]NAS\s*3/iu', 'fin' => '/(?:^|\n)\s*(?:Leguminosas|LEGUMINOSAS)/iu'],
            'Leguminosas' => ['inicio' => '/(?:^|\n)\s*Leguminosas\b/iu', 'fin' => '/(?:^|\n)\s*(?:GRASAS|Grasas)\b/iu'],
            'Grasas' => ['inicio' => '/(?:^|\n)\s*GRASAS\b(?!\s+CON)/iu', 'fin' => '/(?:^|\n)\s*GRASAS\s+CON/iu'],
            'Grasas con proteína' => ['inicio' => '/(?:^|\n)\s*GRASAS\s+CON\s+PROTE/iu', 'fin' => '/(?:^|\n)\s*L[ÁA]CTEOS/iu'],
            'Lácteos' => ['inicio' => '/(?:^|\n)\s*L[ÁA]CTEOS/iu', 'fin' => '/(?:^|\n)\s*(?:ALIMENTOS\s+LIBRES|RECOMENDACIONES)/iu']
        ];

        foreach ($secciones as $nombre => $markers) {
            if (preg_match($markers['inicio'], $texto, $matchInicio, PREG_OFFSET_CAPTURE)) {
                $posInicio = $matchInicio[0][1] + strlen($matchInicio[0][0]);
                $posFin = strlen($texto);
                if (preg_match($markers['fin'], $texto, $matchFin, PREG_OFFSET_CAPTURE, $posInicio)) {
                    $posFin = $matchFin[0][1];
                }
                $seccionTexto = substr($texto, $posInicio, $posFin - $posInicio);
                $alimentos = $this->parsearTablaAlimentos($seccionTexto);
                if (!empty($alimentos)) {
                    $gruposResult[] = ['nombre' => $nombre, 'alimentos' => $alimentos];
                }
            }
        }

        return $gruposResult;
    }

    /**
     * Parsear una tabla de alimentos individual (nombre + equivalente)
     * Handles both line-based text (pdftotext -layout) and concatenated text (PHP native)
     */
    private function parsearTablaAlimentos($textoSeccion)
    {
        $alimentos = [];
        $alimentosEncontrados = [];

        // Clean headers
        $textoLimpio = preg_replace('/ALIMENTO\s+EQUIVALENTE/iu', '', $textoSeccion);
        $textoLimpio = preg_replace('/(?:L\.N\.|Licenciada|nutri_|Especialista)[^\n]*/i', '', $textoLimpio);

        // ---- METHOD 1: Line-by-line (works with pdftotext -layout) ----
        $lineas = preg_split('/\r?\n/', $textoLimpio);
        foreach ($lineas as $linea) {
            $linea = trim($linea);
            if (empty($linea) || mb_strlen($linea) < 5) continue;

            // Multi-space or tab separator: "Nombre alimento    ½ taza"
            if (preg_match('/^(.+?)(?:\s{2,}|\t+)(.+)$/u', $linea, $m)) {
                $nombre = trim($m[1]);
                $equivalente = trim($m[2]);
                if ($this->esAlimentoValido($nombre, $equivalente)) {
                    $key = mb_strtolower($nombre);
                    if (!isset($alimentosEncontrados[$key])) {
                        $alimentosEncontrados[$key] = true;
                        $alimentos[] = ['nombre' => $nombre, 'equivalente' => $equivalente];
                    }
                }
            }
        }

        // If line-by-line found enough results, return them
        if (count($alimentos) >= 3) {
            return $alimentos;
        }

        // ---- METHOD 2: Pattern-matching for concatenated text ----
        $alimentos = [];
        $alimentosEncontrados = [];

        // Normalize whitespace to single spaces
        $texto = preg_replace('/\s+/', ' ', trim($textoLimpio));

        // Units commonly used in the Mexican Equivalent System
        $unidades = 'tazas?|piezas?|cucharadas?|cucharaditas?|rebanadas?|sobres?|latas?|vasos?|paquetes?|barras?|segundos|onzas?|gramos|g(?=[\s,.\)]|$)|gr(?=[\s,.]|$)|ml(?=[\s,.]|$)';
        $modificadores = '(?:\s+(?:chicas?|medianas?|grandes?|pequeñas?|delgadas?|medias?))?';

        // Pattern: quantity (number/fraction) + optional "de" + unit + optional size modifier
        $patronEquiv = '/(\d+(?:[.,]\d+)?(?:\s*[\/]\s*\d+)?(?:\s*[½¼¾⅓⅔⅛])?|[½¼¾⅓⅔⅛])\s*(?:de\s+)?(' . $unidades . ')' . $modificadores . '/iu';

        // Find all quantity+unit matches with their byte positions
        if (preg_match_all($patronEquiv, $texto, $matches, PREG_OFFSET_CAPTURE)) {
            for ($i = 0; $i < count($matches[0]); $i++) {
                $fullMatch = $matches[0][$i][0];
                $posMatch = $matches[0][$i][1];

                // Food name = text from end of previous match to start of this quantity
                if ($i === 0) {
                    $nombre = substr($texto, 0, $posMatch);
                } else {
                    $prevEnd = $matches[0][$i - 1][1] + strlen($matches[0][$i - 1][0]);
                    $nombre = substr($texto, $prevEnd, $posMatch - $prevEnd);
                }

                $nombre = trim($nombre);
                $equivalente = trim($fullMatch);

                if ($this->esAlimentoValido($nombre, $equivalente)) {
                    $key = mb_strtolower($nombre);
                    if (!isset($alimentosEncontrados[$key])) {
                        $alimentosEncontrados[$key] = true;
                        $alimentos[] = [
                            'nombre' => $nombre,
                            'equivalente' => $equivalente
                        ];
                    }
                }
            }
        }

        return $alimentos;
    }

    /**
     * Validate that a parsed food name and equivalent look legitimate
     */
    private function esAlimentoValido($nombre, $equivalente)
    {
        if (mb_strlen($nombre) < 2 || mb_strlen($equivalente) < 1) return false;
        if (!preg_match('/[a-záéíóúñ]/iu', $nombre)) return false;
        if (preg_match('/^(ALIMENTO|EQUIVALENTE|L\.N|Licenciada|Especialista|nutri_|PROTE[IÍ]NAS|Cuadro|Grupo|Desayuno|Colaci[oó]n|Comida|Cena|GRASAS\s+CON|L[ÁA]CTEOS|MODERADOS|LIBRES)/iu', $nombre)) return false;
        return true;
    }

    /**
     * Parsear sección de alimentos libres
     * Handles both line-based and concatenated text
     */
    private function parsearAlimentosLibres($texto)
    {
        $resultado = ['moderados' => [], 'libres' => []];

        // Find the ALIMENTOS LIBRES section
        if (!preg_match('/ALIMENTOS\s+LIBRES(.+?)(?=RECOMENDACIONES|L\.N\.\s|$)/isu', $texto, $m)) {
            return $resultado;
        }

        $seccion = $m[1];

        // ---- METHOD 1: Line-based (pdftotext -layout) ----
        $lineas = preg_split('/\r?\n/', $seccion);
        $tieneLineas = count(array_filter($lineas, fn($l) => mb_strlen(trim($l)) > 2)) > 3;

        if ($tieneLineas) {
            $columna = '';
            foreach ($lineas as $linea) {
                $linea = trim($linea);
                if (empty($linea) || mb_strlen($linea) < 2) continue;
                $lineaLower = mb_strtolower($linea);

                if (mb_strpos($lineaLower, 'moderado') !== false) { $columna = 'moderados'; continue; }
                if ($lineaLower === 'libres' || mb_strpos($lineaLower, 'libres') === 0) { $columna = 'libres'; continue; }
                if (preg_match('/^(ALIMENTO|L\.N|Licenciada|Especialista|nutri_)/i', $linea)) continue;
                if (preg_match('/menos de 10|sin calor|En general condimentos/i', $linea)) continue;

                // Two-column layout with multi-space separator
                if (preg_match('/^(.+?)\s{3,}(.+)$/u', $linea, $cols)) {
                    $col1 = trim($cols[1]);
                    $col2 = trim($cols[2]);
                    if (mb_strlen($col1) >= 2 && preg_match('/[a-záéíóúñ]/iu', $col1)
                        && !preg_match('/menos de 10|sin calor|En general/i', $col1)) {
                        $resultado['moderados'][] = $col1;
                    }
                    if (mb_strlen($col2) >= 2 && preg_match('/[a-záéíóúñ]/iu', $col2)
                        && !preg_match('/sin calor|En general/i', $col2)) {
                        $resultado['libres'][] = $col2;
                    }
                } elseif (!empty($columna) && preg_match('/[a-záéíóúñ]/iu', $linea)) {
                    $resultado[$columna][] = $linea;
                }
            }

            if (!empty($resultado['moderados']) || !empty($resultado['libres'])) {
                return $resultado;
            }
        }

        // ---- METHOD 2: Concatenated text ----
        $textoNorm = preg_replace('/\s+/', ' ', trim($seccion));

        // Remove description texts
        $textoNorm = preg_replace('/Alimentos con menos de 10\s*K?calor[ií]as/iu', '', $textoNorm);
        $textoNorm = preg_replace('/Alimentos sin calor[ií]as/iu', '', $textoNorm);
        $textoNorm = preg_replace('/En general condimentos y especias/iu', '', $textoNorm);

        // Known "libres" items (zero-calorie items)
        $itemsLibres = [
            'Agua', 'Agua mineral', 'Café americano', 'Café instantáneo sin azúcar',
            'Café de grano', 'Té', 'Infusiones', 'Hierbas de olor', 'Especias',
            'Vinagre', 'Limón', 'Ajo', 'Cebolla', 'Mostaza', 'Salsa picante',
            'Chile', 'Pimienta'
        ];

        // Find MODERADOS and LIBRES markers
        $posModerados = mb_stripos($textoNorm, 'MODERADOS');
        $posLibres = mb_stripos($textoNorm, 'LIBRES');

        if ($posModerados !== false && $posLibres !== false) {
            // Extract text between MODERADOS and LIBRES
            $startMod = $posModerados + mb_strlen('MODERADOS');
            $textoModerados = mb_substr($textoNorm, $startMod, $posLibres - $startMod);

            // Extract text after LIBRES
            $startLib = $posLibres + mb_strlen('LIBRES');
            $textoLibres = mb_substr($textoNorm, $startLib);

            // In interleaved column extraction, items alternate between columns
            // Try to split by capitalized food names
            $resultado['moderados'] = $this->extraerNombresAlimentosLibres($textoModerados);
            $resultado['libres'] = $this->extraerNombresAlimentosLibres($textoLibres);
        } elseif ($posModerados !== false || $posLibres !== false) {
            // Only one marker found - extract all items
            $startPos = ($posModerados !== false) ? $posModerados + mb_strlen('MODERADOS') : $posLibres + mb_strlen('LIBRES');
            $textoItems = mb_substr($textoNorm, $startPos);
            $items = $this->extraerNombresAlimentosLibres($textoItems);

            // Classify items using known libres list
            foreach ($items as $item) {
                $esLibre = false;
                foreach ($itemsLibres as $libre) {
                    if (mb_stripos($item, $libre) !== false) { $esLibre = true; break; }
                }
                $resultado[$esLibre ? 'libres' : 'moderados'][] = $item;
            }
        }

        return $resultado;
    }

    /**
     * Extract individual food names from a continuous text of free foods
     */
    private function extraerNombresAlimentosLibres($texto)
    {
        $items = [];
        $texto = trim($texto);
        if (empty($texto)) return $items;

        // Try splitting by common separators
        $partes = preg_split('/[,;]\s*/', $texto);
        if (count($partes) > 2) {
            foreach ($partes as $parte) {
                $parte = trim($parte);
                if (mb_strlen($parte) >= 2 && preg_match('/[a-záéíóúñ]/iu', $parte)
                    && !preg_match('/^(ALIMENTO|L\.N|Licenciada|Especialista|nutri_|menos|sin calor|En general)/i', $parte)) {
                    $items[] = $parte;
                }
            }
            return $items;
        }

        // Split by capitalized word boundaries (each food name starts with uppercase)
        // Pattern: split before each uppercase letter that follows a lowercase letter or space
        $partes = preg_split('/(?<=[a-záéíóúñ])\s+(?=[A-ZÁÉÍÓÚÑ])/u', $texto);
        foreach ($partes as $parte) {
            $parte = trim($parte);
            if (mb_strlen($parte) >= 2 && mb_strlen($parte) <= 60
                && preg_match('/[a-záéíóúñ]/iu', $parte)
                && !preg_match('/^(ALIMENTO|L\.N|Licenciada|Especialista|nutri_|MODERADOS|LIBRES)/i', $parte)
                && !preg_match('/menos de 10|sin calor|En general condimentos/i', $parte)) {
                $items[] = $parte;
            }
        }

        return $items;
    }

    /**
     * Parsear recomendaciones del plan de equivalentes
     * Handles both line-based and concatenated text
     */
    private function parsearRecomendaciones($texto)
    {
        $recomendaciones = [];

        // Find RECOMENDACIONES section - stop at specialist info, food tables, or end
        if (!preg_match('/RECOMENDACIONES(.+?)(?=L\.N\.\s|Cereales\s+ALIMENTO|PROTE[ÍI]NAS|$)/isu', $texto, $m)) {
            return $recomendaciones;
        }

        $seccion = trim($m[1]);

        // Method 1: Split by bullet points (•, -, *, ✓)
        if (preg_match_all('/[•\-\*✓]\s*(.+?)(?=[•\-\*✓]|\z)/su', $seccion, $items)) {
            foreach ($items[1] as $item) {
                $item = trim(preg_replace('/\s+/', ' ', $item));
                if (mb_strlen($item) > 10
                    && !preg_match('/^(L\.N|Licenciada|Especialista|nutri_)/i', $item)) {
                    $recomendaciones[] = $item;
                }
            }
        }

        // Method 2: If no bullets found, try splitting by line breaks
        if (empty($recomendaciones)) {
            $lineas = preg_split('/\r?\n/', $seccion);
            foreach ($lineas as $linea) {
                $linea = trim($linea);
                if (mb_strlen($linea) > 20 && preg_match('/[a-záéíóúñ]/iu', $linea)
                    && !preg_match('/^(L\.N|Licenciada|Especialista|nutri_)/i', $linea)) {
                    $recomendaciones[] = $linea;
                }
            }
        }

        // Method 3: For concatenated text, split by sentence patterns
        if (empty($recomendaciones)) {
            $textoNorm = preg_replace('/\s+/', ' ', $seccion);
            // Remove footer text
            $textoNorm = preg_replace('/L\.N\..*$/iu', '', $textoNorm);
            $textoNorm = preg_replace('/Licenciada.*$/iu', '', $textoNorm);
            $textoNorm = preg_replace('/nutri_.*$/iu', '', $textoNorm);

            // Split by common recommendation starters
            $verbos = 'Puede|Pesar|Realizar|Tomar|Beber|Evitar|Consumir|Incluir|Preferir|Cocinar|Preparar|Utilizar|Comer|No\s+(?:consumir|comer|agregar|utilizar)';
            $partes = preg_split('/(?=' . $verbos . ')/iu', $textoNorm);
            foreach ($partes as $parte) {
                $parte = trim($parte);
                if (mb_strlen($parte) > 15 && preg_match('/[a-záéíóúñ]/iu', $parte)) {
                    // Limit length to a reasonable recommendation
                    if (mb_strlen($parte) > 300) {
                        $parte = mb_substr($parte, 0, 300) . '...';
                    }
                    $recomendaciones[] = $parte;
                }
            }
        }

        return $recomendaciones;
    }

    /**
     * Agregar recetas del catálogo a un plan
     * POST /api/nutricion/planes/{planId}/recetas
     */
    public function addRecetasToPlan($planId)
    {
        $user = \AuthMiddleware::getCurrentUser();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['recetas']) || !is_array($data['recetas'])) {
            return Response::error('Se requiere un array de recetas', 400);
        }

        // Verificar que el plan existe y pertenece al especialista
        $plan = $this->db->query(
            "SELECT id, especialista_id FROM planes_nutricionales WHERE id = ?",
            [$planId]
        )->fetch();

        if (!$plan) {
            return Response::error('Plan no encontrado', 404);
        }

        $insertados = 0;
        $maxOrden = $this->db->query(
            "SELECT COALESCE(MAX(orden), 0) as max_orden FROM plan_comidas WHERE plan_id = ?",
            [$planId]
        )->fetch()['max_orden'];

        foreach ($data['recetas'] as $item) {
            $recetaId = $item['receta_id'] ?? null;
            $tipoComida = $item['tipo_comida'] ?? 'almuerzo';

            if (!$recetaId) continue;

            // Obtener datos de la receta
            $receta = $this->db->query(
                "SELECT * FROM recetas WHERE id = ?",
                [$recetaId]
            )->fetch();

            if (!$receta) continue;

            $maxOrden++;
            $this->db->query(
                "INSERT INTO plan_comidas
                 (plan_id, tipo_comida, nombre_plato, descripcion, ingredientes,
                  calorias, proteinas_g, carbohidratos_g, grasas_g, orden,
                  receta_id, imagen_url, instrucciones_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $planId,
                    $tipoComida,
                    $receta['titulo'],
                    $receta['descripcion'] ?? '',
                    $receta['ingredientes'] ?? '[]',
                    $receta['calorias'] ?? 0,
                    $receta['proteinas'] ?? 0,
                    $receta['carbohidratos'] ?? 0,
                    $receta['grasas'] ?? 0,
                    $maxOrden,
                    $recetaId,
                    $receta['imagen_url'] ?? null,
                    $receta['instrucciones'] ?? '[]'
                ]
            );
            $insertados++;
        }

        // Obtener lista actualizada de comidas con receta
        $comidas = $this->db->query(
            "SELECT pc.*, r.titulo AS receta_titulo, r.imagen_url AS receta_imagen
             FROM plan_comidas pc
             LEFT JOIN recetas r ON pc.receta_id = r.id
             WHERE pc.plan_id = ? AND pc.receta_id IS NOT NULL
             ORDER BY pc.orden",
            [$planId]
        )->fetchAll();

        return Response::success([
            'insertados' => $insertados,
            'comidas' => $comidas
        ]);
    }

    /**
     * Eliminar una receta (comida) de un plan
     * DELETE /api/nutricion/planes/{planId}/recetas/{comidaId}
     */
    public function removeRecetaFromPlan($planId, $comidaId)
    {
        $user = \AuthMiddleware::getCurrentUser();

        $this->db->query(
            "DELETE FROM plan_comidas WHERE id = ? AND plan_id = ? AND receta_id IS NOT NULL",
            [$comidaId, $planId]
        );

        return Response::success(['mensaje' => 'Receta eliminada del plan']);
    }

    /**
     * Subir imagen al plan
     * POST /api/nutricion/planes/{planId}/imagenes
     */
    public function uploadImagenPlan($planId)
    {
        $user = \AuthMiddleware::getCurrentUser();

        // Verificar plan
        $plan = $this->db->query(
            "SELECT id, contenido_json FROM planes_nutricionales WHERE id = ?",
            [$planId]
        )->fetch();

        if (!$plan) {
            return Response::error('Plan no encontrado', 404);
        }

        if (empty($_FILES['imagen'])) {
            return Response::error('No se recibió imagen', 400);
        }

        $file = $_FILES['imagen'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, $allowedTypes)) {
            return Response::error('Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF', 400);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'plan_' . $planId . '_' . uniqid() . '.' . $ext;
        $uploadDir = __DIR__ . '/../../uploads/planes_imagenes/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destPath = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            return Response::error('Error al guardar la imagen', 500);
        }

        $imagePath = '/uploads/planes_imagenes/' . $filename;
        $titulo = $_POST['titulo'] ?? $file['name'];

        // Actualizar contenido_json agregando la imagen
        $contenido = json_decode($plan['contenido_json'] ?? '{}', true) ?: [];
        if (!isset($contenido['imagenes'])) {
            $contenido['imagenes'] = [];
        }
        $contenido['imagenes'][] = [
            'path' => $imagePath,
            'titulo' => $titulo,
            'fecha' => date('Y-m-d H:i:s')
        ];

        $this->db->query(
            "UPDATE planes_nutricionales SET contenido_json = ? WHERE id = ?",
            [json_encode($contenido, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $planId]
        );

        return Response::success([
            'imagen' => ['path' => $imagePath, 'titulo' => $titulo],
            'imagenes' => $contenido['imagenes']
        ]);
    }

    /**
     * Eliminar imagen del plan
     * DELETE /api/nutricion/planes/{planId}/imagenes
     */
    public function removeImagenPlan($planId)
    {
        $user = \AuthMiddleware::getCurrentUser();
        $data = json_decode(file_get_contents('php://input'), true);
        $pathToRemove = $data['path'] ?? '';

        if (empty($pathToRemove)) {
            return Response::error('Se requiere el path de la imagen', 400);
        }

        $plan = $this->db->query(
            "SELECT id, contenido_json FROM planes_nutricionales WHERE id = ?",
            [$planId]
        )->fetch();

        if (!$plan) {
            return Response::error('Plan no encontrado', 404);
        }

        $contenido = json_decode($plan['contenido_json'] ?? '{}', true) ?: [];
        $imagenes = $contenido['imagenes'] ?? [];

        // Filtrar la imagen a eliminar
        $contenido['imagenes'] = array_values(array_filter($imagenes, function ($img) use ($pathToRemove) {
            $path = is_string($img) ? $img : ($img['path'] ?? '');
            return $path !== $pathToRemove;
        }));

        $this->db->query(
            "UPDATE planes_nutricionales SET contenido_json = ? WHERE id = ?",
            [json_encode($contenido, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $planId]
        );

        // Intentar eliminar archivo del disco
        $fullPath = __DIR__ . '/../../' . ltrim($pathToRemove, '/');
        if (file_exists($fullPath)) {
            @unlink($fullPath);
        }

        return Response::success(['mensaje' => 'Imagen eliminada', 'imagenes' => $contenido['imagenes']]);
    }

    /**
 * Obtiene todos los pacientes del especialista
 * con su nombre y folio.
 */
public function getPacientesEspecialista($especialistaId)
{
    try {

        $sql = "
            SELECT
                u.id,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                p.folio
            FROM pacientes p
            INNER JOIN usuarios u
                ON u.id = p.usuario_id
            INNER JOIN asignaciones_especialista_paciente a
                ON a.paciente_id = p.id
            WHERE a.especialista_id = ?
            ORDER BY u.nombre
        ";

        $pacientes = $this->db
            ->query($sql, [$especialistaId])
            ->fetchAll();

        Response::success($pacientes);

    } catch (\Exception $e) {

        Response::error(
            "Error al obtener pacientes",
            500
        );

    }
}
/**
     * =====================================================================
     * GUARDAR UN PLAN DE EQUIVALENTES (SISTEMA MEXICANO DE EQUIVALENTES)
     * =====================================================================
     */
    public function guardarPlanEquivalentes($especialistaId)
    {
        try {
            // 1. Obtener los datos enviados desde el Frontend (React)
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || !isset($input['paciente_id']) || !isset($input['porciones'])) {
                return Response::error('Datos incompletos para guardar el plan de equivalentes.', 400);
            }

            $pacienteId      = $input['paciente_id'];
            $calorias        = $input['calorias_totales'] ?? 0;
            $proteinas       = $input['proteinas_g'] ?? 0;
            $carbohidratos   = $input['carbohidratos_g'] ?? 0;
            $grasas          = $input['grasas_g'] ?? 0;
            $recomendaciones = $input['recomendaciones'] ?? '';
            $porciones       = $input['porciones']; // Arreglo con la cuadrícula de porciones

            // Instanciamos el modelo de equivalentes
            $modeloPlan = new PlanEquivalente();

            // Iniciamos una transacción SQL por seguridad (si falla un registro, no se guarda nada)
            $this->db->beginTransaction();

            // 2. Guardar encabezado del plan (Esto desactiva automáticamente los planes viejos de este paciente)
            $planId = $modeloPlan->guardarEncabezado(
                $pacienteId,
                $especialistaId,
                $calorias,
                $proteinas,
                $carbohidratos,
                $grasas,
                $recomendaciones
            );

            // 3. Recorrer la cuadrícula de porciones y guardarlas una a una
            foreach ($porciones as $fila) {
                // Verificamos que tenga el id del grupo alimenticio
                if (!isset($fila['grupo_alimenticio_id'])) {
                    continue;
                }

                $modeloPlan->guardarPorcionDetalle(
                    $planId,
                    $fila['grupo_alimenticio_id'],
                    $fila['desayuno'] ?? 0.00,
                    $fila['colacion_matutina'] ?? 0.00,
                    $fila['comida'] ?? 0.00,
                    $fila['colacion_vespertina'] ?? 0.00,
                    $fila['cena'] ?? 0.00
                );
            }

            // Si todo salió bien, confirmamos los cambios en MySQL
            $this->db->commit();

            return Response::success(['mensaje' => 'Plan por equivalentes guardado exitosamente.', 'plan_id' => $planId]);

        } catch (\Exception $e) {
            // Si algo truena, revertimos los cambios para no dejar datos basura
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Error en PlanNutricionalController::guardarPlanEquivalentes: " . $e->getMessage());
            return Response::error("Error en el servidor: " . $e->getMessage(), 500);
        }
    }

    /**
     * =====================================================================
     * OBTENER EL PLAN DE EQUIVALENTES ACTIVO DE UN PACIENTE
     * =====================================================================
     */
    public function obtenerPlanEquivalentesPaciente($pacienteId)
    {
        try {
            $modeloPlan = new PlanEquivalente();
            $plan = $modeloPlan->obtenerPlanActivoPorPaciente($pacienteId);

            if (!$plan) {
                return Response::success(['mensaje' => 'El paciente no tiene un plan de equivalentes activo.', 'plan' => null]);
            }

            return Response::success($plan);

        } catch (\Exception $e) {
            error_log("Error en PlanNutricionalController::obtenerPlanEquivalentesPaciente: " . $e->getMessage());
            return Response::error("Error al obtener el plan: " . $e->getMessage(), 500);
        }
    }
};