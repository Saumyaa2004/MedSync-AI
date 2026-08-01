import logoImg from "../assets/logo.png";

export default function Logo({ size = 70 }) {
  return (
    <img
      src={logoImg}
      alt="MedSync AI Logo"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}