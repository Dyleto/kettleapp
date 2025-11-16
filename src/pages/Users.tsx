import { useEffect, useState } from "react";
import { Heading, Spinner } from "@chakra-ui/react";
import api from "@/config/api";

type User = {
  _id: string;
  name: string;
  email: string;
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<User[]>("/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <>
      <Heading>Users</Heading>
    </>
  );
};

export default Users;
