import React, { useEffect, useState } from "react";
import { API_URL } from "../api/api";
import Swal from "sweetalert2";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Stack,
} from "@chakra-ui/react";

function ReportManager() {
  const [evaluations, setEvaluations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editNoteId, setEditNoteId] = useState(null); 
  const [tempNoteValue, setTempNoteValue] = useState("");
  const [showAI, setShowAI] = useState({}); 

  const fetchEvaluations = async () => {
    try {
      const res = await fetch(`${API_URL}/evaluations`);
      const data = await res.json();
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEvaluations(sortedData);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  useEffect(() => { fetchEvaluations(); }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); 
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deleteSelected = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedIds.length} reports.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4a6cf7",
      cancelButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete them!",
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedIds) {
          await fetch(`${API_URL}/evaluations/${id}`, { method: "DELETE" });
        }
        Swal.fire({ icon: "success", title: "Deleted!", timer: 2000, showConfirmButton: false });
        setSelectedIds([]);
        setIsEditMode(false);
        fetchEvaluations();
      } catch (err) {
        Swal.fire("Error", "Failed to delete files.", "error");
      }
    }
  };

  const saveNote = async (id) => {
    try {
      const res = await fetch(`${API_URL}/evaluations/${id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: tempNoteValue }),
      });
      if (res.ok) {
        setEvaluations(prev => prev.map(ev => ev.id === id ? { ...ev, trainer_notes: tempNoteValue } : ev));
        setEditNoteId(null); 
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Saved', showConfirmButton: false, timer: 3000 });
      }
    } catch (err) {
      Swal.fire("Error", "Could not update notes.", "error");
    }
  };

  const startEditing = (report) => {
    setEditNoteId(report.id);
    setTempNoteValue(report.trainer_notes || "");
  };

  /**
   * ✅ NEW PUPPETEER DOWNLOAD LOGIC
   * We hit the backend endpoint which returns a PDF stream.
   */
  const downloadPDF = (reportId) => {
    Swal.fire({
      title: "Preparing Document...",
      text: "Generating a high-quality PDF on the server.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // We use window.location.href to trigger the download from the backend
    // Since the backend sets 'Content-Disposition: attachment', the page won't change.
    window.location.href = `${API_URL}/evaluations/${reportId}/pdf`;

    // Close the loading spinner after a reasonable time
    setTimeout(() => {
      Swal.close();
    }, 3000);
  };

  const filteredReports = evaluations.filter(e => 
    e.trainee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box className="report-manager" p={{ base: 4, md: 6 }}>
      <Box bg="white" p={{ base: 5, md: 6 }} rounded="2xl" shadow="sm" mb={6}>
        <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between" gap={4}>
          <Box>
            <Heading as="h1" size="xl">
              Trainee Archive
            </Heading>
          </Box>

          <Flex gap={3} wrap="wrap">
            {isEditMode && selectedIds.length > 0 && (
              <Button colorScheme="red" onClick={deleteSelected}>
                Delete Selected ({selectedIds.length})
              </Button>
            )}
            <Button
              colorScheme={isEditMode ? "gray" : "blue"}
              variant={isEditMode ? "outline" : "solid"}
              onClick={() => { setIsEditMode(!isEditMode); setSelectedIds([]); }}
            >
              {isEditMode ? "Cancel" : "Manage Files"}
            </Button>
          </Flex>
        </Flex>

        <Box mt={6}>
          <Input
            placeholder="Search archives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="gray.50"
          />
        </Box>
      </Box>

      <TableContainer>
        <Table variant="simple" className="report-table">
          <Thead>
            <Tr>
              {isEditMode && <Th>Select</Th>}
              <Th>Name</Th>
              <Th>Training Time</Th>
              <Th>Score</Th>
              <Th>Reports</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredReports.map((e) => (
              <React.Fragment key={e.id}>
                <Tr className={selectedIds.includes(e.id) ? "selected-row" : ""}>
                  {isEditMode && (
                    <Td>
                      <Checkbox
                        isChecked={selectedIds.includes(e.id)}
                        onChange={() => handleSelect(e.id)}
                      />
                    </Td>
                  )}
                  <Td>
                    <Box className="trainee-info">
                      <Text fontWeight="bold" fontSize="md">{e.trainee_name}</Text>
                      <Text color="gray.500" fontSize="sm">{e.position_name}</Text>
                    </Box>
                  </Td>
                  <Td>{formatDate(e.training_start)} — {formatDate(e.training_end)}</Td>
                  <Td className="grade-cell"><span className="badge-score">{Math.round(e.score)}%</span></Td>
                  <Td>
                    <Button size="sm" variant="outline" onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                      {expandedId === e.id ? "Close" : "View Report"}
                    </Button>
                  </Td>
                </Tr>

                {expandedId === e.id && (
                  <Tr className="expanded-row">
                    <Td colSpan={isEditMode ? 5 : 4}>
                      <Box className="formal-report-paper">
                        <Box className="report-doc-header">
                          <Heading as="h2" size="lg" mb="4">
                            PERFORMANCE EVALUATION REPORT
                          </Heading>
                          <Box className="doc-meta-grid">
                            <Box><Text fontWeight="bold">Trainee:</Text> {e.trainee_name}</Box>
                            <Box><Text fontWeight="bold">Position:</Text> {e.position_name}</Box>
                            <Box><Text fontWeight="bold">Period:</Text> {formatDate(e.training_start)} - {formatDate(e.training_end)}</Box>
                            <Box><Text fontWeight="bold">Score:</Text> {Math.round(e.score)}%</Box>
                            <Box className="no-print">
                              <Button colorScheme="teal" onClick={() => downloadPDF(e.id)}>
                                📥 Download Professional PDF
                              </Button>
                            </Box>
                          </Box>
                        </Box>

                        <Box className="report-doc-section">
                          <Heading as="h3" size="md" mb="4">
                            Detailed Competency Breakdown
                          </Heading>
                          {e.category_breakdown && typeof e.category_breakdown === 'object' ? (
                            Object.entries(e.category_breakdown).map(([category, data]) => (
                              <Box key={category} className="report-category-group" mb="5">
                                <Box className="report-category-header">
                                  <Text>{category}</Text>
                                  <Text>{data.category_avg ? Math.round(data.category_avg) : 0}%</Text>
                                </Box>
                                <Box as="table" className="report-skill-table">
                                  <Box as="tbody">
                                    {data.skills?.map((skill, idx) => (
                                      <Box as="tr" key={idx}>
                                        <Box as="td">{skill.skill_name}</Box>
                                        <Box as="td" className="text-right">{skill.score}/5</Box>
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              </Box>
                            ))
                          ) : <Text>Detailed breakdown unavailable.</Text>}
                        </Box>

                        <Box className="ai-report-container">
                          <Flex className="ai-report-header" align="center" justify="space-between">
                            <Heading as="h3" size="md">Performance Insights</Heading>
                            <Button
                              size="sm"
                              variant="outline"
                              className="no-print"
                              onClick={() => setShowAI(prev => ({ ...prev, [e.id]: !prev[e.id] }))}
                            >
                              {showAI[e.id] ? "Hide Details" : "Show Details"}
                            </Button>
                          </Flex>
                          {showAI[e.id] && (
                            <Box className="ai-report-content" mt="4">
                              {e.ai_feedback || "No automated feedback available."}
                            </Box>
                          )}
                        </Box>

                        <Box className="report-doc-section">
                          <Flex className="note-header" align="center" justify="space-between" mb="4">
                            <Heading as="h3" size="md">Trainer Observations</Heading>
                            <Box className="no-print">
                              {editNoteId === e.id ? (
                                <Button colorScheme="blue" size="sm" onClick={() => saveNote(e.id)}>Save</Button>
                              ) : (
                                <Button colorScheme="gray" size="sm" onClick={() => startEditing(e)}>Edit</Button>
                              )}
                            </Box>
                          </Flex>
                          <Box as="textarea"
                            value={editNoteId === e.id ? tempNoteValue : (e.trainer_notes || "")}
                            onChange={(evt) => setTempNoteValue(evt.target.value)}
                            disabled={editNoteId !== e.id}
                            className={editNoteId === e.id ? "report-textarea editing" : "report-textarea"}
                            style={{ width: '100%', minHeight: '150px', padding: '12px', borderRadius: '10px', borderColor: '#e2e8f0', resize: 'vertical' }}
                          />
                        </Box>
                      </Box>
                    </Td>
                  </Tr>
                )}
              </React.Fragment>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ReportManager;