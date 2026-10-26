
import SignClient from "./SignClient";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SignPage({ params }: PageProps) {
  const { id } = await params;

  return <SignClient id={id} />;
}
