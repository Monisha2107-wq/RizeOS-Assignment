import db from '../../config/db';

export class SmartAssignEngine {
  public async recommendAssignees(orgId: string, requiredSkills: string[]) {
    if (!requiredSkills || requiredSkills.length === 0) {
      throw new Error("Task must have required skills to generate recommendations.");
    }

    const query = `
      SELECT 
        e.id, 
        e.name, 
        e.role, 
        e.skills, 
        COALESCE(a.productivity_score, 50) as productivity_score 
      FROM employees e
      LEFT JOIN ai_scores a ON e.id = a.employee_id
      WHERE e.org_id = $1 AND e.status = 'active'
    `;
    
    const result = await db.query(query, [orgId]);
    const employees = result.rows;

    const candidates = employees.map(emp => {

      const empSkills: string[] = typeof emp.skills === 'string' ? JSON.parse(emp.skills) : (emp.skills || []);
      
      const matchedSkills = requiredSkills.filter(skill => empSkills.includes(skill));
      const skillMatchPercentage = matchedSkills.length / requiredSkills.length; 

      const normalizedProductivity = parseFloat(emp.productivity_score) / 100;

      const candidateScore = (skillMatchPercentage * 0.70) + (normalizedProductivity * 0.30);

      let explanation = `${Math.round(skillMatchPercentage * 100)}% skill match.`;
      if (emp.productivity_score > 80) explanation += ' High historical productivity.';

      return {
        employee_id: emp.id,
        name: emp.name,
        role: emp.role,
        matched_skills: matchedSkills,
        match_score: Math.round(candidateScore * 100), 
        explanation
      };
    });

    const topCandidates = candidates
      .filter(c => c.match_score > 0) 
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 3);

    return topCandidates;
  }
}

export default new SmartAssignEngine();