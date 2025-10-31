import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "./layouts/dashboard";
import DashboardPage from "./modules/Dashboard/dashboard-page";
import LoginPage from "./pages/login";
import NotFoundPage from "./pages/not-found";
import DoctorsPage from "./modules/Doctors/doctors";
import { AuthProvider } from "./auth/ProtectedRoute";
import DevicesPage from "./modules/Device/devices";
import PatientPage from "./modules/Patient/patient";
import FamilyPage from "./modules/Family/family";
import AppoinmentPage from "./modules/Appoinment/appointment";
import AppointmentViewPage from "./modules/Appoinment/view-appointment";
import SessionPage from "./modules/Session/session";
import GalleryPage from "./modules/Appoinment/list-appointment";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <AuthProvider>
        <DashboardLayout />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "doctor", element: <DoctorsPage /> },
      { path: "devices", element: <DevicesPage /> },
      { path: "patients", element: <PatientPage /> },
      { path: "family", element: <FamilyPage /> },
      { path: "appointment", element: <AppoinmentPage /> },
      { path: "appointment/:id", element: <AppointmentViewPage /> },
      { path: "session/:id", element: <SessionPage /> },
      { path: "gallery/:id", element: <GalleryPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
