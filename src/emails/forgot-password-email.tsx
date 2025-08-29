
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
  render,
} from '@react-email/components';
import * as React from 'react';

interface ForgotPasswordEmailProps {
  validationLink?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
const logoUrl = `https://storage.googleapis.com/snapmoment-6xfqd.firebasestorage.app/assets/logo.png`;


export const ForgotPasswordEmail = ({
  validationLink = 'https://wegwerpcamera.nl',
}: ForgotPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset uw wachtwoord voor Wegwerpcamera.nl</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={logoUrl}
          width="200"
          height="45"
          alt="Wegwerpcamera.nl"
          style={logo}
        />
        <Text style={tertiary}>Wachtwoord Reset</Text>
        <Text style={paragraph}>
          Er is een verzoek gedaan om het wachtwoord voor uw account opnieuw in te stellen.
          Als u dit verzoek niet heeft gedaan, kunt u deze e-mail negeren.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={validationLink}>
            Reset Wachtwoord
          </Button>
        </Section>
        <Text style={paragraph}>
          Als de knop hierboven niet werkt, kunt u de volgende link kopiëren en in uw browser plakken:
        </Text>
        <Link href={validationLink} style={link}>
          {validationLink}
        </Link>
        <Text style={paragraph}>
          Met vriendelijke groet,
          <br />
          Het Wegwerpcamera.nl Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ForgotPasswordEmail;

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

