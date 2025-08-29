# **App Name**: SnapMoment

## Core Features:

- Homepage: Landing page with links to external website and client login.
- Login Portals: Central hub linking to role-specific login pages (Client, Admin, Partner).
- Login Router: Role-based login with Firebase Authentication, redirects to correct dashboard after role identification.
- Test Account Generation: Tool to create a demo event via a Genkit flow that generates a temporary test user.
- Event Landing: Event welcome page displaying event name, cover image, camera access buttons, PWA prompt and a language selector.
- Camera Interface: In-app camera with photo capture, storage and upload capabilities and image counter. Links to the Review Page.
- AI-Powered Photo Selection: Tool using the photoSelection flow to suggest selecting the best photos from uploaded photos to present the user. Also can uploads from local device.
- Direct Access via QR-code: Guests scan a QR code and get direct access to the event's camera interface on their own phone.
- Simple Camera-experience: The interface mimics a disposable camera with a limited number of "photos", encouraging spontaneity. Guests can take photos, but cannot directly edit or delete them extensively.
- Local Storage: Taken photos are first stored locally on the guest's device, so the camera works even without a perfect internet connection.
- Review & Upload: Guests can complete their "roll" and then select and upload their photos to the event's central gallery in a separate screen.
- Central Gallery & Slideshow: All uploaded photos come together in a live photo gallery (livestream) and an automatic slideshow, which can be shown on screens during the event.
- Klanten (Event Organizers): Separate, secure dashboards for event organizers to manage their event, adjust the cover photo, and publish the photo gallery for guests.
- Administrators: Separate, secure dashboards for administrators for full management of all events, users, and system settings.
- Partners (B2B): Separate, secure dashboards for partners (B2B): A whitelabel environment where partners can manage events for their own clients, complete with their own branding.

## Style Guidelines:

- A vibrant, purplish violet (#6d28d9), used for buttons, logos, and key accents. This radiates creativity and festivity.
- A warm, sunny yellow/orange (#fbbf24), often used as a contrasting color in the UI, for example for AI selection or special badges.
- A neutral background of white and light gray tones (#f9fafb), which ensures a calm and clear layout.
- Font pairing: 'Poppins' (sans-serif) for headlines and short text chunks; 'PT Sans' (sans-serif) for body text.
- Lucide React icons will be used
- Modern and clean layout, focusing on ease of use. Grid and card based design for dashboards. Utilize ShadCN components for a polished UI.
- Subtle animations and transitions for a smooth user experience. Implement `tailwindcss-animate` for polished UI transitions.