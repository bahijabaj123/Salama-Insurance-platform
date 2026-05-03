-- =============================================================================
-- Données de test optionnelles (SalamaInsuranceDB / MySQL, phpMyAdmin).
-- Le message "404 ... /api/claims/2/notes" n’est PAS dû à une ligne manquante
-- en base : c’est une route HTTP absente sur le JAR en cours d’exécution.
-- Solutions : redémarrer le backend après compilation, ou le frontend qui
-- retente automatiquement en PUT si PATCH répond 404.
-- =============================================================================
START TRANSACTION;

INSERT IGNORE INTO insurers (id, email, first_name, last_name, role, created_at)
VALUES (1, 'assureur.demo@salama.ma', 'Jean', 'Dupont', 'ASSUREUR', NOW());

INSERT INTO accidents (
  accident_date, injuries, location, observations,
  property_damage, sketch, `time`, status
) VALUES (
  '2026-05-10', 0, 'Tunis', 'Accident de test (script seed garage)',
  1, NULL, '10:00:00', 'VALIDE'
);
SET @acc_id = LAST_INSERT_ID();

INSERT INTO claims (
  reference, status, opening_date, last_modified_date, region,
  severity_level, urgency_score, notes, accident_id, insurer_id
)
SELECT
  src.reference,
  src.status,
  src.opening_date,
  src.last_modified_date,
  src.region,
  src.severity_level,
  src.urgency_score,
  src.notes,
  src.accident_id,
  src.insurer_id
FROM (
  SELECT
    'CLM-SEED-GARAGE-TEST' AS reference,
    'OPENED' AS status,
    NOW() AS opening_date,
    NOW() AS last_modified_date,
    'Tunis' AS region,
    'MEDIUM' AS severity_level,
    40 AS urgency_score,
    'Notes initiales (seed)' AS notes,
    @acc_id AS accident_id,
    1 AS insurer_id
) AS src
WHERE NOT EXISTS (SELECT 1 FROM claims WHERE reference = 'CLM-SEED-GARAGE-TEST');

COMMIT;

-- Après exécution : SELECT id, reference FROM claims WHERE reference = 'CLM-SEED-GARAGE-TEST';
-- Ouvrez /assureur/claims/<id>/garage avec cet id (pas forcément 2).
