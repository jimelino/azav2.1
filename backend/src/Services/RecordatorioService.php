<?php
namespace App\Services;

class RecordatorioService {
    public function schedule($recordatorio) {
        // Programar recordatorio
        return true;
    }
    
    public function reschedule($recordatorioId) {
        // Reprogramar recordatorio
        return true;
    }
    
    public function send($recordatorio) {
        $emailService = new EmailService();
        return $emailService->sendRecordatorioEmail($recordatorio);
    }
}
