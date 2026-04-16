declare module "react-payment-icons-inline" {
  import { SVGProps } from "react";

  interface PaymentIconProps extends SVGProps<SVGSVGElement> {
    id: string;
  }

  const PaymentIcon: (props: PaymentIconProps) => JSX.Element;
  export default PaymentIcon;
}
