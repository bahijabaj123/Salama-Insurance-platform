package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Repository.ComplaintRepository;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ComplaintSarraService implements IComplaintSarraService {
    @Autowired
    private ComplaintRepository complaintRepository;
    @Autowired
    private IndemnityRepository indemnityRepository;
    @Override
    public ComplaintSarra createComplaint(ComplaintSarra complaint) {
        return complaintRepository.save(complaint);
    }
    public ComplaintSarra createAndLinkToIndemnity(ComplaintSarra complaint, Long indemnityId) {
        IndemnitySarra indemnity = indemnityRepository.findById(indemnityId)
                .orElseThrow(() -> new RuntimeException("Indemnité non trouvée avec l'ID : " + indemnityId));

        complaint.setIndemnity(indemnity);
        return complaintRepository.save(complaint);
    }
    @Override
    public List<ComplaintSarra> getAllComplaints() {
        return complaintRepository.findAll();
    }

    @Override
    public ComplaintSarra getComplaintById(Long id) {
        return complaintRepository.findById(id).orElse(null);
    }

    @Override
    public void deleteComplaint(Long id) {
        complaintRepository.deleteById(id);
    }


}
