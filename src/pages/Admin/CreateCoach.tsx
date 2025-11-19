import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import eventEmitter from "@/utils/eventEmitter";
import { Button, Container, Heading, Input, VStack } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/toast";
import React from "react";

const AdminCreateCoach = () => {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/admin/create-coach", formData);
      toaster.create({
        title: "Coach créé avec succès",
        description: `${formData.firstName} ${formData.lastName} (${formData.email}) a été ajouté en tant que coach.`,
        type: "success",
        duration: 5000,
      });

      setFormData({ firstName: "", lastName: "", email: "" });
    } catch (error: any) {
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        eventEmitter.emit("error", {
          title: "Erreur lors de la création du coach",
          message:
            error.response?.data?.message ||
            "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container centerContent py={20}>
      <VStack as="form" onSubmit={handleSubmit} gap={4} w="100%" maxW="md">
        <Heading>Créer un coach</Heading>

        <Input
          placeholder="Prénom"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          required
        />

        <Input
          placeholder="Nom"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          required
        />

        <Input
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Button
          type="submit"
          bg="yellow.400"
          color="fg.inverted"
          loading={loading}
        >
          Créer le coach
        </Button>
      </VStack>
    </Container>
  );
};

export default AdminCreateCoach;
