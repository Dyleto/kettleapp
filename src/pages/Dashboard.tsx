import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Card,
  Container,
  Grid,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container>
      <Heading mt="6" ml="10">
        Bonjour {user?.name || "Utilisateur"},
      </Heading>

      <Grid
        gridTemplateColumns={{
          base: "320px",
          md: "320px 320px",
          lg: "320px 320px 320px",
        }}
        justifyContent={"center"}
        alignItems={"center"}
        mt="6"
        gap="4"
      >
        <Card.Root
          bg="transparent"
          borderColor={"yellow.400"}
          borderStyle={"dashed"}
          _hover={{ bg: "yellow.400", color: "fg.inverted", cursor: "pointer" }}
        >
          <Card.Header>
            <Heading fontWeight="bold">Prochaine séance</Heading>
            <Text textStyle="sm" mt="1">
              Séance Jambes
            </Text>
          </Card.Header>
          <Stack w="100%" mt="5" mb="3" textAlign="center">
            <Text textAlign="center" fontWeight="semibold">
              Voir la séance
            </Text>
          </Stack>
        </Card.Root>
        {Array.from({ length: 3 }).map((_, idx) => (
          <Box key={idx}>
            <Card.Root
              bg="bg.inverted"
              color="fg.inverted"
              borderColor={"yellow.400"}
              borderStyle={"dashed"}
              _hover={{
                bg: "yellow.400",
                color: "fg.inverted",
                cursor: "pointer",
              }}
            >
              <Card.Header>
                <Heading fontWeight="bold">Séance Jambes</Heading>
                <Text textStyle="sm" mt="1">
                  Jeu. 20/05
                </Text>
              </Card.Header>
              <Stack w="100%" mt="5" mb="3" textAlign="center">
                <Text textAlign="center" fontWeight="semibold">
                  Voir la séance
                </Text>
              </Stack>
            </Card.Root>

            {/* <Card.Root bg="bg.inverted" color="fg.inverted">
              <Card.Header>
                <Heading fontWeight="semibold">Séance Jambes</Heading>
                <Text color="fg.subtle" textStyle="sm">
                  Jeu. 20/05
                </Text>
              </Card.Header>
              <Stack w="100%" mt="5" textAlign="center">
                <Button
                  variant="outline"
                  bg="yellow.400"
                  color="fg.inverted"
                  border="none"
                  borderTopStartRadius="0"
                  borderTopEndRadius="0"
                >
                  Voir la séance
                </Button>
              </Stack>
            </Card.Root> */}
          </Box>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;
