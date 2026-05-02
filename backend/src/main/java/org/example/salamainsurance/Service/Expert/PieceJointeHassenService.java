package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.PieceJointeHassen;
import org.example.salamainsurance.Repository.Expert.PieceJointeHassenRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PieceJointeHassenService implements IPieceJointeHassenService {

    private final PieceJointeHassenRepository pieceJointeRepository;

    public PieceJointeHassenService(PieceJointeHassenRepository pieceJointeRepository) {
        this.pieceJointeRepository = pieceJointeRepository;
    }

    @Override public List<PieceJointeHassen> getAllPiecesJointes() { return pieceJointeRepository.findAll(); }
    @Override public Optional<PieceJointeHassen> getPieceJointeById(Integer id) { return pieceJointeRepository.findById(id); }
    @Override public PieceJointeHassen savePieceJointe(PieceJointeHassen p) { return pieceJointeRepository.save(p); }
    @Override public void deletePieceJointe(Integer id) { pieceJointeRepository.deleteById(id); }

    @Override
    public List<PieceJointeHassen> getPiecesJointesByRapportId(Integer rapportId) {
        return pieceJointeRepository.findByRapportExpertise_IdRapport(rapportId);
    }
}