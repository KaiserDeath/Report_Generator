import { useState, useEffect } from "react";
import { API_URL } from "../api/api";
import Swal from "sweetalert2"; // 1. Import SweetAlert2
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Heading,
  Textarea,
  Stack,
} from "@chakra-ui/react";

function TraineeForm() {
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Training Window States
  const [trainingStart, setTrainingStart] = useState("");
  const [trainingEnd, setTrainingEnd] = useState("");

  // Modal & Result States
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(null);
  const [trainerNotes, setTrainerNotes] = useState("");

  // Edit Lock State
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/positions`)
      .then((res) => res.json())
      .then((data) => setPositions(data || []));
  }, []);

  const handlePositionChange = async (e) => {
    const posId = e.target.value;
    setSelectedPosition(posId);
    setScores({});
    setResult(null);
    if (!posId) return;
    try {
      const res = await fetch(`${API_URL}/positions/${posId}/weights`);
      const data = await res.json();
      setSkills(data || []);
    } catch (err) {
      console.error("Error loading skills", err);
    }
  };

  const handleScoreChange = (skillId, value) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    const numValue = cleanValue === "" ? "" : parseInt(cleanValue, 10);

    if (numValue === "" || (numValue >= 0 && numValue <= 100)) {
      setScores({ ...scores, [skillId]: numValue === "" ? null : numValue });
    }
  };

  const handleSubmit = async () => {
    // 2. SweetAlert2 Validation Replacement
    if (!selectedPosition || !firstName || !lastName || !trainingStart || !trainingEnd) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in the Name, Position, and Training Dates before submitting.",
        confirmButtonColor: "#4a6cf7"
      });
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainee_name: `${firstName} ${lastName}`.trim(),
          trainer_name: trainerName,
          position_id: selectedPosition,
          evaluation: scores,
          training_start: trainingStart,
          training_end: trainingEnd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setResult(data);
      setIsEditing(false); 
      setShowModal(true);
      
      // Success Toast after submission
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Analysis complete!',
        showConfirmButton: false,
        timer: 2000
      });

    } catch (err) {
      Swal.fire("Submission Error", err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!result || !result.id) return;

    try {
      const res = await fetch(`${API_URL}/evaluations/${result.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: trainerNotes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      // 3. SweetAlert2 Final Success Notification
      await Swal.fire({
        icon: "success",
        title: "Report Finalized",
        text: "The evaluation has been successfully archived.",
        timer: 2500,
        showConfirmButton: false
      });

      setShowModal(false);
      setIsEditing(false); 
      
      // Reset Form
      setFirstName("");
      setLastName("");
      setTrainerName("");
      setSelectedPosition("");
      setScores({});
      setTrainerNotes("");
      setTrainingStart("");
      setTrainingEnd("");
      setResult(null);
    } catch (err) {
      Swal.fire("Save Error", err.message, "error");
    }
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category_name || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }} bg="gray.50" minH="calc(100vh - 40px)">
      <Heading as="h1" size="2xl" mb="6" textAlign="center">
        Trainee Evaluation
      </Heading>

      <Box bg="white" p={{ base: 5, md: 8 }} rounded="2xl" shadow="sm" mb="6">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
          <FormControl>
            <FormLabel>First Name</FormLabel>
            <Input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              bg="gray.50"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Last Name</FormLabel>
            <Input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              bg="gray.50"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Evaluated By (Trainer)</FormLabel>
            <Input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              placeholder="Enter your name"
              bg="gray.50"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Position</FormLabel>
            <Select value={selectedPosition} onChange={handlePositionChange} bg="gray.50">
              <option value="">Select a Position</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Training Start</FormLabel>
            <Input
              type="date"
              value={trainingStart}
              onChange={(e) => setTrainingStart(e.target.value)}
              bg="gray.50"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Training End</FormLabel>
            <Input
              type="date"
              value={trainingEnd}
              onChange={(e) => setTrainingEnd(e.target.value)}
              bg="gray.50"
            />
          </FormControl>
        </SimpleGrid>
      </Box>

      {selectedPosition && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" mb="6">
          {Object.keys(groupedSkills).map((catName) => (
            <Box key={catName} bg="white" p="5" rounded="2xl" shadow="sm">
              <Heading as="h2" size="md" mb="4">
                {catName}
              </Heading>
              <Stack spacing="3">
                {groupedSkills[catName].map((skill) => (
                  <FormControl key={skill.id} display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel mb="0" flex="1" mr="4">
                      {skill.name}
                    </FormLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={scores[skill.id] ?? ""}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => handleScoreChange(skill.id, e.target.value)}
                      maxW="120px"
                      bg="gray.50"
                    />
                  </FormControl>
                ))}
              </Stack>
            </Box>
          ))}

          <Box gridColumn={{ base: "auto", md: "span 2" }} textAlign="right">
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Analyzing..."
            >
              Submit Evaluation
            </Button>
          </Box>
        </SimpleGrid>
      )}

      {showModal && result && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Evaluation Complete: {`${firstName} ${lastName}`.trim()}</h2>
            
            <div className="ai-feedback-section">
              <h4>Performance Report Insights (Score: {result.generalEvaluation}%)</h4>
              <p>{result.aiFeedback}</p>
            </div>

            <div className="trainer-note-area">
              <div className="note-header">
                <label>✍️ Trainer Notes:</label>
                <button 
                  type="button" 
                  className="btn-small" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "🔓 Lock Notes" : "📝 Edit Notes"}
                </button>
              </div>
              
              <textarea 
                placeholder={isEditing ? "Write observations here..." : "Notes are locked. Click Edit to add feedback."}
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "readonly-textarea" : ""}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              <button 
                onClick={handleSaveNotes} 
                className="btn-primary"
                disabled={!isEditing && trainerNotes === ""}
              >
                Save & Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}

export default TraineeForm;