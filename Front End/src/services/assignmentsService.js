import api from './api';

const assignmentsService = {
  assign: async (payload) => 
    (await api.post('/gym/assignments', payload)).data?.assignment ?? {},
  
  end: async (payload) => 
    (await api.post('/gym/assignments/end', payload)).data?.updated ?? [],
  
  // ✅ Simply call the existing end() function
  endAssignment: async (payload) => assignmentsService.end(payload),
  
  byCoach: async (coach_id) => 
    (await api.get(`/gym/assignments/by-coach/${coach_id}`)).data?.assignments ?? [],
  
  byMember: async (member_id) => 
    (await api.get(`/gym/assignments/by-member/${member_id}`)).data?.assignments ?? []
};

export default assignmentsService;