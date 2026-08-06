<?php
namespace App\Services;

class ModerationService {
    public function moderate($content) {
        // Moderar contenido (palabras prohibidas, spam, etc). Coincidencia de
        // palabra completa (no substring): "prohibido" se quitó de la lista
        // porque es una palabra normal en contexto médico/rehabilitación
        // ("tengo prohibido cargar peso") y generaba falsos positivos.
        $badWords = ['spam'];
        foreach ($badWords as $word) {
            if (preg_match('/\b' . preg_quote($word, '/') . '\b/iu', $content)) {
                return ['approved' => false, 'reason' => 'Contenido inapropiado'];
            }
        }
        return ['approved' => true];
    }
    
    public function notifyModerators($reporte) {
        // Notificar a moderadores
        return true;
    }
}
