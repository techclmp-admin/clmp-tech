
import React from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import WhyCLMPSection from '@/components/WhyCLMPSection';
import WhoItsForSection from '@/components/WhoItsForSection';
import ComparisonSection from '@/components/ComparisonSection';
import PricingSection from '@/components/PricingSection';
import ComplianceSection from '@/components/ComplianceSection';
import UpcomingFeaturesSection from '@/components/UpcomingFeaturesSection';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhyCLMPSection />
      <WhoItsForSection />
      <ComparisonSection />
      <PricingSection />
      <ComplianceSection />
      <UpcomingFeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
