"use client";

import { useRef } from "react";
import { ExternalLink, GitBranch, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Project = {
  id: number;
  name: string;
  note: string;
  description: string;
  img: string;
  images?: string[];
  githubUrl?: string;
  liveUrl?: string;
};

type DetailsModalProps = {
  project: Project;
  triggerClassName?: string;
};

export default function DetailsModal({
  project,
  triggerClassName,
}: DetailsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const images =
    project.images && project.images.length >= 3
      ? project.images.slice(0, 3)
      : [project.img, project.img, project.img];

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <>
      <Button
        type="button"
        className={triggerClassName}
        onClick={openModal}
        aria-haspopup="dialog"
      >
        See More
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`project-title-${project.id}`}
        aria-describedby={`project-description-${project.id}`}
        className="project-modal"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <div className="project-modal-panel">
          <button
            type="button"
            className="project-modal-close"
            onClick={closeModal}
            aria-label={`Close ${project.name}`}
            title="Close"
          >
            <X size={22} />
          </button>

          <h2 id={`project-title-${project.id}`}>{project.name}</h2>
          <p className="project-modal-note">{project.note}</p>

          <div className="project-modal-gallery">
            {images.map((image, index) => (
              <div
                className="p-3 neumorphic-two"
                key={`${project.id}-${image}-${index}`}
              >
                <img
                  key={`${project.id}-${image}-${index}`}
                  src={image}
                  alt={`${project.name} preview ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <p
            id={`project-description-${project.id}`}
            className="project-modal-description"
          >
            {project.description}
          </p>

          <div className="project-modal-links">
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="project-modal-link"
              >
                <GitBranch size={18} />
                GitHub
              </a>
            ) : (
              <span
                className="project-modal-link is-unavailable"
                aria-disabled="true"
              >
                <GitBranch size={18} />
                GitHub
              </span>
            )}

            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="project-modal-link"
              >
                <ExternalLink size={18} />
                Live Demo
              </a>
            ) : (
              <span
                className="project-modal-link is-unavailable"
                aria-disabled="true"
              >
                <ExternalLink size={18} />
                Live Demo
              </span>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
