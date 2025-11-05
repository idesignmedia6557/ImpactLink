import React from 'react';
import { Link } from 'react-router-dom';
import './ProjectCard.css';

const ProjectCard = ({ project }) => {
  const progressPercentage = (project.currentFunding / project.fundingGoal) * 100;

  return (
    <div className="project-card">
      <img
        src={project.imageUrl}
        alt={project.title}
        className="project-card-image"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/400x200?text=Project+Image';
        }}
      />
      <div className="project-card-content">
        <div className="project-card-header">
          <h3 className="project-card-title">{project.title}</h3>
          <span className="project-card-category">{project.category}</span>
        </div>
        <p className="project-card-description">{project.description}</p>
        <div className="project-card-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="progress-text">
            <span>
              <strong>${project.currentFunding.toLocaleString()}</strong> raised
            </span>
            <span>of ${project.fundingGoal.toLocaleString()}</span>
          </div>
        </div>
        <div className="project-card-footer">
          <span className="project-card-charity">{project.charity}</span>
          <Link to={`/charity/${project.id}`}>
            <button className="project-card-btn">View Project</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
