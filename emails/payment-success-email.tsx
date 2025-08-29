
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PaymentSuccessEmailProps {
  eventName?: string;
  dashboardLink?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
const logoUrl = `https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/assets/logo.png`;


export const PaymentSuccessEmail = ({
  eventName = 'Uw Evenement',
  dashboardLink = 'https://wegwerpcamera.nl/login',
}: PaymentSuccessEmailProps) => (
  <Html>
    <Head />
    <Preview>Betaling ontvangen voor {eventName}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={logoUrl}
          width="200"
          height="45"
          alt="Wegwerpcamera.nl"
          style={logo}
        />
        <Text style={tertiary}>Betaling Geslaagd</Text>
        <Text style={paragraph}>
          Beste klant,
        </Text>
        <Text style={paragraph}>
          Hartelijk dank! We hebben uw betaling in goede orde ontvangen voor het evenement: <strong>{eventName}</strong>.
          Uw evenement is nu volledig geactiveerd en alle functies zijn beschikbaar.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={dashboardLink}>
            Ga naar uw Dashboard
          </Button>
        </Section>
        <Text style={paragraph}>
          Wij wensen u en uw gasten een fantastisch evenement vol onvergetelijke momenten!
        </Text>
        <Text style={paragraph}>
          Met vriendelijke groet,
          <br />
          Het Wegwerpcamera.nl Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PaymentSuccessEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  border: '1px solid #eaeaea',
};

const logo = {
  margin: '0 auto',
};

const tertiary = {
  color: '#0a85ea',
  fontSize: '18px',
  fontWeight: '700',
  lineHeight: '16px',
  textAlign: 'center' as const,
  padding: '0 40px',
};


const paragraph = {
  color: '#444',
  fontSize: '15px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const buttonContainer = {
  padding: '20px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#262 81% 51%',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const link = {
    color: '#0a85ea',
    textDecoration: 'underline',
};
