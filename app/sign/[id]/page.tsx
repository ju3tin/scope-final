
import SignClient from "./SignClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SignPage({ params }: PageProps) {
  const { id } = await params;

  return <SignClient id={id} />;
}
