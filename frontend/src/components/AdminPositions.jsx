import { useState, useEffect } from "react";
import { API_URL } from "../api/api";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

function AdminPositions() {
  const [positions, setPositions] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [weights, setWeights] = useState({});
  const [catWeights, setCatWeights] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/positions`).then(res => res.json()).then(setPositions);
    fetch(`${API_URL}/positions/skills/all`).then(res => res.json()).then(setAllSkills);
  }, []);

  const handlePositionChange = async (e) => {
    const posId = e.target.value;
    setSelectedPosition(posId);
    setIsEditing(false); 
    if (!posId) return;

    const res = await fetch(`${API_URL}/positions/${posId}/weights`);
    const data = await res.json();
    
    const newWeights = {};
    const newCatWeights = {};
    data.forEach(item => {
      newWeights[item.id] = item.weight;
      if (item.category_id) newCatWeights[item.category_id] = item.cat_global_weight;
    });
    setWeights(newWeights);
    setCatWeights(newCatWeights);
  };

  const groupedSkills = allSkills.reduce((acc, skill) => {
    const catName = skill.category_name || "Uncategorized"; 
    if (!acc[catName]) {
      acc[catName] = { id: skill.category_id, skills: [] };
    }
    acc[catName].skills.push(skill);
    return acc;
  }, {});

  const saveAll = async () => {
    const totalGlobal = Object.values(catWeights).reduce((a, b) => a + (Number(b) || 0), 0);
    if (Math.round(totalGlobal * 100) !== 100) {
      alert(`❌ Global Impact must total 100%. Current: ${Math.round(totalGlobal * 100)}%`);
      return;
    }

    try {
      await fetch(`${API_URL}/positions/${selectedPosition}/weights`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
      });
      await fetch(`${API_URL}/positions/${selectedPosition}/category-weights`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryWeights: catWeights }),
      });
      alert("✅ Configuration Saved!");
      setIsEditing(false);
    } catch (err) { alert("Save failed."); }
  };

  return (
    <Box className="admin-container" p={{ base: 4, md: 6 }}>
      <Box bg="white" p={{ base: 5, md: 8 }} rounded="2xl" shadow="sm" mb={6}>
        <Heading as="h1" size="xl" mb={2}>
          Position Management
        </Heading>
        <Text color="gray.600">Configure weights and skill impacts</Text>

        <Flex direction={{ base: "column", md: "row" }} align="center" gap={4} mt={6}>
          <FormControl maxW={{ base: "100%", md: "420px" }}>
            <FormLabel>Select Role to Manage</FormLabel>
            <Select value={selectedPosition} onChange={handlePositionChange} bg="gray.50">
              <option value="">-- Choose a Role --</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormControl>

          <Flex gap={3} wrap="wrap">
            {selectedPosition && !isEditing && (
              <Button colorScheme="blue" onClick={() => setIsEditing(true)}>
                ✏️ Edit Mode
              </Button>
            )}
            {isEditing && (
              <Button colorScheme="green" onClick={saveAll}>
                💾 Save Changes
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>

      {selectedPosition ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {Object.keys(groupedSkills).map((catName) => {
            const categoryId = groupedSkills[catName].id;
            return (
              <Box key={catName} bg="white" p="5" rounded="2xl" shadow="sm">
                <Flex align="center" justify="space-between" mb="4" pb="3" borderBottom="2px solid" borderColor="gray.100">
                  <Heading as="h2" size="md">
                    {catName}
                  </Heading>
                  <Flex align="center" gap={2}>
                    <Text fontSize="sm" color="gray.600">
                      Global Impact:
                    </Text>
                    {isEditing ? (
                      <Flex align="center" gap={2}>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={categoryId ? (catWeights[categoryId] ? Math.round(catWeights[categoryId] * 100) : "") : ""}
                          onChange={(e) => {
                            const val = Number(e.target.value) / 100;
                            setCatWeights({ ...catWeights, [categoryId]: val });
                          }}
                          maxW="120px"
                          bg="gray.50"
                        />
                        <Text>%</Text>
                      </Flex>
                    ) : (
                      <Text color="blue.600" fontWeight="bold">
                        {categoryId && catWeights[categoryId] ? Math.round(catWeights[categoryId] * 100) : 0}%
                      </Text>
                    )}
                  </Flex>
                </Flex>

                <Stack spacing="3">
                  {groupedSkills[catName].skills.map((skill) => (
                    <Flex
                      key={skill.id}
                      justify="space-between"
                      align="center"
                      py="3"
                      borderBottom="1px solid"
                      borderColor="gray.100"
                    >
                      <Text>{skill.name}</Text>
                      {isEditing ? (
                        <Flex align="center" gap={2}>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={weights[skill.id] ? Math.round(weights[skill.id] * 100) : ""}
                            onChange={(e) => {
                              const val = Number(e.target.value) / 100;
                              setWeights({ ...weights, [skill.id]: val });
                            }}
                            maxW="120px"
                            bg="gray.50"
                          />
                          <Text>%</Text>
                        </Flex>
                      ) : (
                        <Text color="gray.600">
                          {weights[skill.id] ? Math.round(weights[skill.id] * 100) : 0}%
                        </Text>
                      )}
                    </Flex>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </SimpleGrid>
      ) : (
        <Box bg="white" p="10" rounded="2xl" shadow="sm" textAlign="center">
          <Text color="gray.600">Please select a position to manage its configuration.</Text>
        </Box>
      )}
    </Box>
  );
}

export default AdminPositions;