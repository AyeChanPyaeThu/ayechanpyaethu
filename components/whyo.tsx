"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@base-ui/react";

type Interest = {
  id: number;
  name: string;
  description: string;
  img: string;
};

type WhyProps = {
  interest: Interest;
  triggerClassName?: string;
};

export default function Why({ interest }: WhyProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <>
      {/* <Button
        className="neumorphic-two btn-neu"
        onClick={openModal}
        aria-haspopup="dialog"
      >
        Why?
      </Button> */}

      <Button
        className="neumorphic-two btn-interest"
        onClick={openModal}
        aria-label="Phone"
      >
        Why?
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`interest-title-${interest.id}`}
        aria-describedby={`interest-description-${interest.id}`}
        className="interest-modal"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <button
          type="button"
          className="project-modal-close"
          onClick={closeModal}
          aria-label={`Close ${interest.name}`}
          title="Close"
        >
          <X size={22} />
        </button>
        <div className="project-modal-panel grid grid-cols-5 gap-8 items-center justify-center px-18">
          {/* left side image */}
          <div className="w-full col-span-2 ">
            <img src={interest.img} className="" />
          </div>

          <div className="col-span-3 flex flex-col gap-3 text-black">
            <h1 className="text-2xl">{interest.name}</h1>
            <p className="text-justify">{interest.description}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
