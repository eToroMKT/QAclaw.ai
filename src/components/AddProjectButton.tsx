"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddProjectModal from "./AddProjectModal";

export default function AddProjectButton() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-400 hover:to-green-500 transition-all">
        ➕ Add Project
      </button>
      {showModal && (
        <AddProjectModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); router.refresh(); }}
        />
      )}
    </>
  );
}
