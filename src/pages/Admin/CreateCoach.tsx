import { useCreateCoach } from "@/hooks/mutations/useCreateCoach";
import { Button, Container, Heading, Input, VStack } from "@chakra-ui/react";
import React from "react";

const AdminCreateCoach = () => {
  const { mutate, isPending } = useCreateCoach();
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate(formData, {
      onSuccess: () => {
        // Réinitialiser le formulaire après succès
        setFormData({ firstName: "", lastName: "", email: "" });
      },
    });
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
          loading={isPending}
        >
          Créer le coach
        </Button>
      </VStack>
    </Container>
  );
};

export default AdminCreateCoach;
