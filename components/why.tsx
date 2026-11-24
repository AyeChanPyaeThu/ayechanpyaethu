"use client";

import { useRef } from "react";
import {
  BookOpenText,
  Lightbulb,
  PencilSparkles,
  SearchCode,
  Sparkles,
  TvMinimalPlay,
  UserRoundGroup,
  X,
} from "lucide-react";
import { Button } from "@base-ui/react";

type Interest = {
  id: string | number;
  name: string;
  description: string;
  img: string;
};

type WhyProps = {
  interest: Interest;
  triggerClassName?: string;
};

export default function Why({ interest, triggerClassName }: WhyProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  // Render icon with switch case
  const renderIcon = (type: Interest) => {
    switch (type.name) {
      case "Learning":
        return <SearchCode size={60} />;
      case "Reading":
        return <BookOpenText size={60} />;
      case "Discussing":
        return <UserRoundGroup size={60} />;
      case "Problems":
        return <Lightbulb size={60} />;
      case "Drawing":
        return <PencilSparkles size={60} />;
      case "Movies":
        return <TvMinimalPlay size={60} />;
      default:
        return <Sparkles size={60} />;
    }
  };

  return (
    <>
      {/* WHY BUTTON */}
      <Button
        className={`neumorphic-two btn-interest ${triggerClassName ?? ""}`}
        onClick={openModal}
        aria-haspopup="dialog"
        aria-label={`Why I am interested in ${interest.name}`}
      >
        Why?
      </Button>

      {/* MODAL */}
      <dialog
        ref={dialogRef}
        aria-labelledby={`interest-title-${interest.id}`}
        aria-describedby={`interest-description-${interest.id}`}
        className="interest-modal"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          className="interest-modal-close"
          onClick={closeModal}
          aria-label={`Close ${interest.name}`}
          title="Close"
        >
          <X size={22} />
        </button>

        {/* MODAL CONTENT */}
        <div className="interest-modal-panel">
          {/* IMAGE */}
          {/* <div className="interest-modal-image"> */}
          {/* <img src={interest.img} alt={interest.name} loading="lazy" /><{interest.icon}/> */}
          {/* </div> */}

          {/* DESCRIPTION */}
          <div className="interest-modal-content">
            <div className="flex gap-5 items-center">
              <div> {renderIcon(interest)}</div>
              <div>
                <span className="interest-modal-label">MY INTEREST</span>

                <h2 id={`interest-title-${interest.id}`}>{interest.name}</h2>
              </div>
            </div>

            <p id={`interest-description-${interest.id}`}>
              {interest.description}
            </p>

            <div className="interest-modal-footer">
              <span className="text-amber-700/50">
                ✦ Something I enjoy exploring
              </span>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
