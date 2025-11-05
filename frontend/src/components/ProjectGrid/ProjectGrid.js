import React, { useState, useEffect } from 'react';
import ProjectCard from '../ProjectCard/ProjectCard';
import './ProjectGrid.css';

const ProjectGrid = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for API call - will fetch from backend
    const fetchProjects = async () => {
      setLoading(true);
      // Simulating API call with mock data
      setTimeout(() => {
        setProjects([
          {
            id: 1,
            title: 'Clean Water Initiative',
            description: 'Providing clean water access to rural communities in Africa',
            category: 'Environment',
            fundingGoal: 50000,
            currentFunding: 32500,
            imageUrl: '/images/projects/water.jpg',
            charity: 'Water For All'
          },
          {
            id: 2,
            title: 'Education for Every Child',
            description: 'Building schools and providing educational resources',
            category: 'Education',
            fundingGoal: 75000,
            currentFunding: 45000,
            imageUrl: '/images/projects/education.jpg',
            charity: 'Global Education Fund'
          },
          {
            id: 3,
            title: 'Medical Care Outreach',
            description: 'Mobile healthcare services for underserved areas',
            category: 'Healthcare',
            fundingGoal: 100000,
            currentFunding: 68000,
            imageUrl: '/images/projects/healthcare.jpg',
            charity: 'Healthcare For All'
          }
        ]);
        setLoading(false);
      }, 500);
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <section className="project-grid">
        <div className="container">
          <h2>Featured Projects</h2>
          <div className="loading-message">Loading projects...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="project-grid">
      <div className="container">
        <h2>Featured Projects</h2>
        <p className="section-subtitle">Support verified projects making real impact</p>
        <div className="grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGrid;
