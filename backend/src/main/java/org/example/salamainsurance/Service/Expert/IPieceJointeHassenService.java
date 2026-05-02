package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.PieceJointeHassen;

import java.util.List;
import java.util.Optional;

public interface IPieceJointeHassenService {

    List<PieceJointeHassen> getAllPiecesJointes();

    Optional<PieceJointeHassen> getPieceJointeById(Integer id);

    PieceJointeHassen savePieceJointe(PieceJointeHassen pieceJointe);

    void deletePieceJointe(Integer id);

    List<PieceJointeHassen> getPiecesJointesByRapportId(Integer rapportId);
}