import { supabase } from "@/integrations/supabase/client";

export const ontarioConstructionTemplates = [
  // RESIDENTIAL TEMPLATES (5)
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Single Family Home Construction',
    description: 'Complete template for new single-family residential construction in Ontario. Includes all phases from permits to occupancy, compliant with OBC 2024.',
    category: 'residential',
    template_data: {
      phases: ["Pre-Construction", "Foundation", "Framing", "Exterior Envelope", "MEP Rough-In", "Insulation & Drywall", "Interior Finishes", "Final Inspections"],
      default_tasks: [
        { name: "Building Permit Application", phase: "Pre-Construction", duration: "4 weeks" },
        { name: "Site Survey & Geotechnical", phase: "Pre-Construction", duration: "2 weeks" },
        { name: "Excavation & Grading", phase: "Foundation", duration: "1 week" },
        { name: "Foundation Pour", phase: "Foundation", duration: "2 weeks" },
        { name: "Waterproofing", phase: "Foundation", duration: "3 days" },
        { name: "Framing - Walls & Roof", phase: "Framing", duration: "4 weeks" },
        { name: "Windows & Doors Installation", phase: "Exterior Envelope", duration: "1 week" },
        { name: "Roofing", phase: "Exterior Envelope", duration: "1 week" },
        { name: "Siding", phase: "Exterior Envelope", duration: "2 weeks" },
        { name: "Electrical Rough-In", phase: "MEP Rough-In", duration: "2 weeks" },
        { name: "Plumbing Rough-In", phase: "MEP Rough-In", duration: "2 weeks" },
        { name: "HVAC Installation", phase: "MEP Rough-In", duration: "1 week" },
        { name: "Insulation", phase: "Insulation & Drywall", duration: "1 week" },
        { name: "Drywall & Taping", phase: "Insulation & Drywall", duration: "3 weeks" },
        { name: "Interior Painting", phase: "Interior Finishes", duration: "2 weeks" },
        { name: "Flooring", phase: "Interior Finishes", duration: "2 weeks" },
        { name: "Kitchen & Bath Fixtures", phase: "Interior Finishes", duration: "2 weeks" },
        { name: "Final Electrical", phase: "Final Inspections", duration: "1 week" },
        { name: "Final Plumbing", phase: "Final Inspections", duration: "3 days" },
        { name: "Building Inspection", phase: "Final Inspections", duration: "1 week" },
        { name: "Occupancy Permit", phase: "Final Inspections", duration: "1 week" }
      ],
      milestones: ["Permit Issued", "Foundation Complete", "Frame Inspection Passed", "Insulation Inspection", "Final Inspection", "Occupancy Permit Issued"]
    },
    is_system_template: true,
    estimated_duration: '6-9 months',
    estimated_budget: '$350,000 - $600,000',
    complexity: 'high',
    required_permits: ["Building Permit", "Site Plan Approval", "Electrical Safety Authority Permit", "Plumbing Permit", "HVAC Permit", "Septic Permit (if applicable)"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    name: 'Full Home Renovation',
    description: 'Comprehensive renovation template for existing homes including structural modifications, compliant with Ontario renovation standards.',
    category: 'residential',
    template_data: {
      phases: ["Assessment & Design", "Permits & Approvals", "Demolition", "Structural Work", "MEP Upgrades", "Interior Renovations", "Final Touches"],
      default_tasks: [
        { name: "Home Inspection", phase: "Assessment & Design", duration: "1 day" },
        { name: "Architectural Drawings", phase: "Assessment & Design", duration: "3 weeks" },
        { name: "Structural Engineering Review", phase: "Assessment & Design", duration: "2 weeks" },
        { name: "Building Permit", phase: "Permits & Approvals", duration: "3 weeks" },
        { name: "Interior Demolition", phase: "Demolition", duration: "1 week" },
        { name: "Hazardous Material Removal", phase: "Demolition", duration: "1 week" },
        { name: "Load-Bearing Wall Modifications", phase: "Structural Work", duration: "2 weeks" },
        { name: "New Beam Installation", phase: "Structural Work", duration: "3 days" },
        { name: "Electrical Panel Upgrade", phase: "MEP Upgrades", duration: "2 days" },
        { name: "Plumbing Re-routing", phase: "MEP Upgrades", duration: "1 week" },
        { name: "New HVAC System", phase: "MEP Upgrades", duration: "1 week" },
        { name: "Insulation Upgrade", phase: "Interior Renovations", duration: "1 week" },
        { name: "Drywall & Ceilings", phase: "Interior Renovations", duration: "2 weeks" },
        { name: "Kitchen Installation", phase: "Interior Renovations", duration: "2 weeks" },
        { name: "Bathroom Renovation", phase: "Interior Renovations", duration: "3 weeks" },
        { name: "Flooring", phase: "Final Touches", duration: "1 week" },
        { name: "Painting", phase: "Final Touches", duration: "1 week" },
        { name: "Trim & Millwork", phase: "Final Touches", duration: "1 week" },
        { name: "Final Inspection", phase: "Final Touches", duration: "3 days" }
      ],
      milestones: ["Design Approved", "Permits Obtained", "Demolition Complete", "Rough-In Inspections Passed", "Drywall Complete", "Final Inspection Passed"]
    },
    is_system_template: true,
    estimated_duration: '3-6 months',
    estimated_budget: '$150,000 - $400,000',
    complexity: 'high',
    required_permits: ["Building Permit", "Electrical Permit", "Plumbing Permit", "HVAC Permit", "Heritage Permit (if required)"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    name: 'Townhouse Development',
    description: 'Multi-unit townhouse development template for 4-12 units, including site servicing and common areas.',
    category: 'residential',
    template_data: {
      phases: ["Planning & Approvals", "Site Development", "Foundation & Structure", "Envelope & Roofing", "MEP Systems", "Interior Finishes", "Landscaping & Final"],
      default_tasks: [
        { name: "Site Plan Approval", phase: "Planning & Approvals", duration: "12 weeks" },
        { name: "Zoning Compliance Review", phase: "Planning & Approvals", duration: "4 weeks" },
        { name: "Building Permit - Multiple Units", phase: "Planning & Approvals", duration: "6 weeks" },
        { name: "Servicing Agreement", phase: "Planning & Approvals", duration: "8 weeks" },
        { name: "Site Clearing & Grading", phase: "Site Development", duration: "2 weeks" },
        { name: "Municipal Services Connection", phase: "Site Development", duration: "3 weeks" },
        { name: "Storm & Sanitary Systems", phase: "Site Development", duration: "4 weeks" },
        { name: "Foundation - All Units", phase: "Foundation & Structure", duration: "6 weeks" },
        { name: "Framing - Row Houses", phase: "Foundation & Structure", duration: "12 weeks" },
        { name: "Fire Separation Walls", phase: "Foundation & Structure", duration: "included" },
        { name: "Roofing Systems", phase: "Envelope & Roofing", duration: "4 weeks" },
        { name: "Windows & Doors - All Units", phase: "Envelope & Roofing", duration: "3 weeks" },
        { name: "Exterior Cladding", phase: "Envelope & Roofing", duration: "6 weeks" },
        { name: "Electrical Service - Main & Units", phase: "MEP Systems", duration: "6 weeks" },
        { name: "Plumbing - All Units", phase: "MEP Systems", duration: "6 weeks" },
        { name: "HVAC - Individual Systems", phase: "MEP Systems", duration: "4 weeks" },
        { name: "Insulation & Drywall", phase: "Interior Finishes", duration: "8 weeks" },
        { name: "Kitchen & Bath - All Units", phase: "Interior Finishes", duration: "8 weeks" },
        { name: "Flooring - All Units", phase: "Interior Finishes", duration: "6 weeks" },
        { name: "Landscaping & Grading", phase: "Landscaping & Final", duration: "3 weeks" },
        { name: "Parking & Driveways", phase: "Landscaping & Final", duration: "2 weeks" },
        { name: "Final Inspections - All Units", phase: "Landscaping & Final", duration: "2 weeks" }
      ],
      milestones: ["Site Plan Approved", "Building Permits Issued", "Foundation Complete", "Framing Complete", "Rough-In Inspections", "Drywall Complete", "Final Inspections", "Occupancy Permits"]
    },
    is_system_template: true,
    estimated_duration: '12-18 months',
    estimated_budget: '$1.5M - $4M',
    complexity: 'high',
    required_permits: ["Site Plan Approval", "Building Permit (Multiple Dwellings)", "Servicing Agreement", "Development Charges", "Electrical Permits", "Plumbing Permits", "HVAC Permits", "Grading Permit"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    name: 'Basement Finishing',
    description: 'Transform unfinished basement into living space with bedroom, bathroom, and recreation area.',
    category: 'residential',
    template_data: {
      phases: ["Planning", "Permits", "Rough-In", "Framing & Insulation", "Finishes"],
      default_tasks: [
        { name: "Design Layout", phase: "Planning", duration: "1 week" },
        { name: "Egress Window Planning", phase: "Planning", duration: "included" },
        { name: "Building Permit", phase: "Permits", duration: "2 weeks" },
        { name: "Electrical Rough-In", phase: "Rough-In", duration: "1 week" },
        { name: "Plumbing Rough-In", phase: "Rough-In", duration: "1 week" },
        { name: "HVAC Extensions", phase: "Rough-In", duration: "3 days" },
        { name: "Framing Walls", phase: "Framing & Insulation", duration: "1 week" },
        { name: "Insulation", phase: "Framing & Insulation", duration: "3 days" },
        { name: "Drywall", phase: "Framing & Insulation", duration: "2 weeks" },
        { name: "Flooring", phase: "Finishes", duration: "1 week" },
        { name: "Bathroom Installation", phase: "Finishes", duration: "2 weeks" },
        { name: "Painting", phase: "Finishes", duration: "1 week" },
        { name: "Trim & Doors", phase: "Finishes", duration: "1 week" },
        { name: "Final Inspection", phase: "Finishes", duration: "1 day" }
      ],
      milestones: ["Permit Issued", "Rough-In Complete", "Framing Inspection", "Drywall Complete", "Final Inspection"]
    },
    is_system_template: true,
    estimated_duration: '6-10 weeks',
    estimated_budget: '$45,000 - $85,000',
    complexity: 'medium',
    required_permits: ["Building Permit", "Electrical Permit", "Plumbing Permit"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    name: 'Laneway House / Garden Suite',
    description: 'Secondary dwelling unit construction including separate services and compliance with municipal ADU bylaws.',
    category: 'residential',
    template_data: {
      phases: ["Municipal Approval", "Site Preparation", "Foundation & Structure", "Building Envelope", "MEP Installation", "Interior Completion"],
      default_tasks: [
        { name: "Zoning Variance (if needed)", phase: "Municipal Approval", duration: "8 weeks" },
        { name: "Site Plan Approval", phase: "Municipal Approval", duration: "6 weeks" },
        { name: "Building Permit", phase: "Municipal Approval", duration: "4 weeks" },
        { name: "Utility Connections Approval", phase: "Municipal Approval", duration: "4 weeks" },
        { name: "Site Access & Staging", phase: "Site Preparation", duration: "1 week" },
        { name: "Excavation", phase: "Site Preparation", duration: "1 week" },
        { name: "Foundation", phase: "Foundation & Structure", duration: "2 weeks" },
        { name: "Framing", phase: "Foundation & Structure", duration: "3 weeks" },
        { name: "Roofing", phase: "Building Envelope", duration: "1 week" },
        { name: "Windows & Doors", phase: "Building Envelope", duration: "1 week" },
        { name: "Siding", phase: "Building Envelope", duration: "2 weeks" },
        { name: "Electrical Service & Panel", phase: "MEP Installation", duration: "1 week" },
        { name: "Plumbing Connections", phase: "MEP Installation", duration: "1 week" },
        { name: "HVAC System", phase: "MEP Installation", duration: "1 week" },
        { name: "Insulation & Vapor Barrier", phase: "Interior Completion", duration: "1 week" },
        { name: "Drywall", phase: "Interior Completion", duration: "2 weeks" },
        { name: "Kitchen & Bathroom", phase: "Interior Completion", duration: "2 weeks" },
        { name: "Flooring", phase: "Interior Completion", duration: "1 week" },
        { name: "Painting & Finishes", phase: "Interior Completion", duration: "1 week" },
        { name: "Landscaping & Pathway", phase: "Interior Completion", duration: "1 week" },
        { name: "Final Inspection", phase: "Interior Completion", duration: "1 week" }
      ],
      milestones: ["Municipal Approvals Complete", "Foundation Poured", "Frame Inspection", "Rough-In Inspection", "Final Inspection", "Occupancy Permit"]
    },
    is_system_template: true,
    estimated_duration: '4-7 months',
    estimated_budget: '$180,000 - $320,000',
    complexity: 'high',
    required_permits: ["Zoning Approval/Variance", "Site Plan Approval", "Building Permit", "Electrical Permit", "Plumbing Permit", "HVAC Permit", "Development Charges"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },

  // COMMERCIAL TEMPLATES (5)
  {
    id: '30000000-0000-0000-0000-000000000001',
    name: 'Office Building Construction',
    description: 'Multi-story office building with commercial HVAC, accessibility compliance, and parking facilities.',
    category: 'commercial',
    template_data: {
      phases: ["Pre-Construction", "Site Work", "Structure", "Building Envelope", "MEP Systems", "Interior Build-Out", "Commissioning"],
      default_tasks: [
        { name: "Site Plan Approval", phase: "Pre-Construction", duration: "12 weeks" },
        { name: "Building Permit", phase: "Pre-Construction", duration: "8 weeks" },
        { name: "TSSA Reviews", phase: "Pre-Construction", duration: "4 weeks" },
        { name: "Site Clearing & Demolition", phase: "Site Work", duration: "2 weeks" },
        { name: "Excavation & Shoring", phase: "Site Work", duration: "4 weeks" },
        { name: "Underground Utilities", phase: "Site Work", duration: "3 weeks" },
        { name: "Foundation & Basement", phase: "Structure", duration: "8 weeks" },
        { name: "Structural Steel/Concrete", phase: "Structure", duration: "16 weeks" },
        { name: "Curtain Wall System", phase: "Building Envelope", duration: "12 weeks" },
        { name: "Roofing & Waterproofing", phase: "Building Envelope", duration: "4 weeks" },
        { name: "Central HVAC System", phase: "MEP Systems", duration: "12 weeks" },
        { name: "Electrical Distribution", phase: "MEP Systems", duration: "16 weeks" },
        { name: "Fire Protection System", phase: "MEP Systems", duration: "8 weeks" },
        { name: "Elevator Installation", phase: "MEP Systems", duration: "12 weeks" },
        { name: "Interior Partitions", phase: "Interior Build-Out", duration: "10 weeks" },
        { name: "Ceiling Systems", phase: "Interior Build-Out", duration: "8 weeks" },
        { name: "Flooring", phase: "Interior Build-Out", duration: "8 weeks" },
        { name: "Washrooms", phase: "Interior Build-Out", duration: "6 weeks" },
        { name: "Building Automation Testing", phase: "Commissioning", duration: "3 weeks" },
        { name: "Fire Safety Plan Approval", phase: "Commissioning", duration: "2 weeks" },
        { name: "Final Inspections", phase: "Commissioning", duration: "2 weeks" }
      ],
      milestones: ["Permits Issued", "Foundation Complete", "Structure Topped Out", "Building Enclosed", "MEP Rough-In Complete", "Substantial Completion", "Occupancy Permit"]
    },
    is_system_template: true,
    estimated_duration: '18-24 months',
    estimated_budget: '$8M - $25M',
    complexity: 'high',
    required_permits: ["Site Plan Approval", "Building Permit", "Electrical Permit", "Plumbing Permit", "HVAC Permit", "Fire Safety Plan", "Elevator Permit", "Development Charges", "Environmental Permits"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    name: 'Retail Plaza Development',
    description: 'Strip mall or retail plaza with multiple tenant spaces, shared services, and parking lot.',
    category: 'commercial',
    template_data: {
      phases: ["Development Approval", "Site Development", "Building Construction", "Tenant Improvements", "Site Completion"],
      default_tasks: [
        { name: "Rezoning (if required)", phase: "Development Approval", duration: "16 weeks" },
        { name: "Site Plan Approval", phase: "Development Approval", duration: "12 weeks" },
        { name: "Building Permit - Shell", phase: "Development Approval", duration: "8 weeks" },
        { name: "Grading & Drainage", phase: "Site Development", duration: "3 weeks" },
        { name: "Parking Lot & Curbs", phase: "Site Development", duration: "4 weeks" },
        { name: "Storm Management", phase: "Site Development", duration: "3 weeks" },
        { name: "Foundation - Full Building", phase: "Building Construction", duration: "4 weeks" },
        { name: "Structural Frame", phase: "Building Construction", duration: "8 weeks" },
        { name: "Roof Structure & Membrane", phase: "Building Construction", duration: "3 weeks" },
        { name: "Exterior Walls & Storefronts", phase: "Building Construction", duration: "6 weeks" },
        { name: "Base Building HVAC", phase: "Building Construction", duration: "6 weeks" },
        { name: "Base Building Electrical", phase: "Building Construction", duration: "8 weeks" },
        { name: "Base Building Plumbing", phase: "Building Construction", duration: "4 weeks" },
        { name: "Demising Walls", phase: "Building Construction", duration: "3 weeks" },
        { name: "Tenant Space Partitions", phase: "Tenant Improvements", duration: "4 weeks" },
        { name: "Tenant HVAC Connections", phase: "Tenant Improvements", duration: "3 weeks" },
        { name: "Tenant Electrical", phase: "Tenant Improvements", duration: "4 weeks" },
        { name: "Tenant Finishes", phase: "Tenant Improvements", duration: "6 weeks" },
        { name: "Signage & Lighting", phase: "Site Completion", duration: "2 weeks" },
        { name: "Landscaping", phase: "Site Completion", duration: "3 weeks" },
        { name: "Paving & Line Painting", phase: "Site Completion", duration: "2 weeks" }
      ],
      milestones: ["Site Plan Approved", "Building Permit Issued", "Foundation Complete", "Building Enclosed", "Base Building Complete", "Tenant Improvements Complete", "Occupancy Permit"]
    },
    is_system_template: true,
    estimated_duration: '12-18 months',
    estimated_budget: '$3M - $8M',
    complexity: 'high',
    required_permits: ["Site Plan Approval", "Building Permit", "Sign Permits", "Electrical Permits", "Plumbing Permits", "Development Charges", "Grading Permit"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    name: 'Restaurant Build-Out',
    description: 'Commercial kitchen and dining space build-out with health department compliance.',
    category: 'commercial',
    template_data: {
      phases: ["Design & Approvals", "Demolition", "MEP Rough-In", "Kitchen Installation", "Dining Area Finishes"],
      default_tasks: [
        { name: "Health Department Plan Review", phase: "Design & Approvals", duration: "3 weeks" },
        { name: "Building Permit", phase: "Design & Approvals", duration: "4 weeks" },
        { name: "Fire Department Review", phase: "Design & Approvals", duration: "2 weeks" },
        { name: "Interior Demolition", phase: "Demolition", duration: "1 week" },
        { name: "Hood & Fire Suppression Design", phase: "Design & Approvals", duration: "2 weeks" },
        { name: "Grease Trap Installation", phase: "MEP Rough-In", duration: "1 week" },
        { name: "Commercial Kitchen Plumbing", phase: "MEP Rough-In", duration: "2 weeks" },
        { name: "Commercial Kitchen Electrical", phase: "MEP Rough-In", duration: "2 weeks" },
        { name: "HVAC & Ventilation", phase: "MEP Rough-In", duration: "2 weeks" },
        { name: "Gas Lines", phase: "MEP Rough-In", duration: "1 week" },
        { name: "Kitchen Equipment Installation", phase: "Kitchen Installation", duration: "2 weeks" },
        { name: "Hood & Suppression System", phase: "Kitchen Installation", duration: "1 week" },
        { name: "Walk-in Cooler/Freezer", phase: "Kitchen Installation", duration: "1 week" },
        { name: "Dining Area Flooring", phase: "Dining Area Finishes", duration: "2 weeks" },
        { name: "Millwork & Fixtures", phase: "Dining Area Finishes", duration: "3 weeks" },
        { name: "Washroom Finishes", phase: "Dining Area Finishes", duration: "2 weeks" },
        { name: "Painting & Decor", phase: "Dining Area Finishes", duration: "2 weeks" },
        { name: "Final Health Inspection", phase: "Dining Area Finishes", duration: "1 week" },
        { name: "Building Final Inspection", phase: "Dining Area Finishes", duration: "1 week" }
      ],
      milestones: ["Permits Approved", "Demolition Complete", "MEP Rough-In Approved", "Kitchen Equipment Installed", "Health Inspection Passed", "Occupancy Permit"]
    },
    is_system_template: true,
    estimated_duration: '3-5 months',
    estimated_budget: '$250,000 - $600,000',
    complexity: 'high',
    required_permits: ["Building Permit", "Health Department Approval", "Fire Suppression Permit", "Electrical Permit", "Plumbing Permit", "Gas Permit", "Sign Permit", "Liquor License (if applicable)"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    name: 'Medical/Dental Office',
    description: 'Healthcare facility with specialized HVAC, accessibility, and medical gas systems.',
    category: 'commercial',
    template_data: {
      phases: ["Planning & Permits", "Base Building Work", "MEP Systems", "Medical Fit-Out", "Final Compliance"],
      default_tasks: [
        { name: "Ministry of Health Review (if required)", phase: "Planning & Permits", duration: "6 weeks" },
        { name: "Building Permit", phase: "Planning & Permits", duration: "4 weeks" },
        { name: "AODA Compliance Review", phase: "Planning & Permits", duration: "2 weeks" },
        { name: "Interior Partitions", phase: "Base Building Work", duration: "3 weeks" },
        { name: "Accessibility Features", phase: "Base Building Work", duration: "included" },
        { name: "Specialized HVAC (air changes)", phase: "MEP Systems", duration: "4 weeks" },
        { name: "Medical Gas Systems", phase: "MEP Systems", duration: "2 weeks" },
        { name: "Enhanced Electrical", phase: "MEP Systems", duration: "3 weeks" },
        { name: "Plumbing - Clinical Sinks", phase: "MEP Systems", duration: "2 weeks" },
        { name: "X-Ray Room Shielding (if needed)", phase: "Medical Fit-Out", duration: "1 week" },
        { name: "Medical Casework", phase: "Medical Fit-Out", duration: "3 weeks" },
        { name: "Flooring - Medical Grade", phase: "Medical Fit-Out", duration: "2 weeks" },
        { name: "Sterilization Room", phase: "Medical Fit-Out", duration: "1 week" },
        { name: "Waiting Area Finishes", phase: "Medical Fit-Out", duration: "2 weeks" },
        { name: "Reception & Admin Area", phase: "Medical Fit-Out", duration: "2 weeks" },
        { name: "AODA Final Inspection", phase: "Final Compliance", duration: "1 week" },
        { name: "Building Final Inspection", phase: "Final Compliance", duration: "1 week" },
        { name: "TSSA Inspections", phase: "Final Compliance", duration: "1 week" }
      ],
      milestones: ["Permits Issued", "Partitions Complete", "MEP Rough-In Approved", "Medical Equipment Installed", "AODA Compliance Verified", "Occupancy Permit"]
    },
    is_system_template: true,
    estimated_duration: '4-7 months',
    estimated_budget: '$300,000 - $750,000',
    complexity: 'high',
    required_permits: ["Building Permit", "Electrical Permit", "Plumbing Permit", "HVAC Permit", "Medical Gas Permit", "AODA Compliance", "Radiation Safety (if X-ray)"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    name: 'Warehouse & Distribution Center',
    description: 'Industrial/commercial warehouse with loading docks, high ceilings, and material handling systems.',
    category: 'commercial',
    template_data: {
      phases: ["Site Development", "Building Structure", "Building Systems", "Interior Fit-Out", "Site Completion"],
      default_tasks: [
        { name: "Site Plan Approval", phase: "Site Development", duration: "10 weeks" },
        { name: "Building Permit", phase: "Site Development", duration: "6 weeks" },
        { name: "Site Grading", phase: "Site Development", duration: "2 weeks" },
        { name: "Storm Management", phase: "Site Development", duration: "3 weeks" },
        { name: "Slab-on-Grade Foundation", phase: "Building Structure", duration: "4 weeks" },
        { name: "Structural Steel Frame", phase: "Building Structure", duration: "8 weeks" },
        { name: "Pre-Engineered Metal Building", phase: "Building Structure", duration: "6 weeks" },
        { name: "Loading Dock Construction", phase: "Building Structure", duration: "3 weeks" },
        { name: "Roofing", phase: "Building Structure", duration: "4 weeks" },
        { name: "Industrial Electrical", phase: "Building Systems", duration: "6 weeks" },
        { name: "LED High-Bay Lighting", phase: "Building Systems", duration: "2 weeks" },
        { name: "Industrial HVAC/Heating", phase: "Building Systems", duration: "4 weeks" },
        { name: "Fire Sprinkler System", phase: "Building Systems", duration: "4 weeks" },
        { name: "Dock Levelers & Seals", phase: "Building Systems", duration: "2 weeks" },
        { name: "Office Area Build-Out", phase: "Interior Fit-Out", duration: "6 weeks" },
        { name: "Washroom Facilities", phase: "Interior Fit-Out", duration: "3 weeks" },
        { name: "Racking Systems (if included)", phase: "Interior Fit-Out", duration: "3 weeks" },
        { name: "Concrete Flooring - Polished", phase: "Interior Fit-Out", duration: "included" },
        { name: "Truck Court Paving", phase: "Site Completion", duration: "2 weeks" },
        { name: "Parking & Landscaping", phase: "Site Completion", duration: "3 weeks" },
        { name: "Site Lighting", phase: "Site Completion", duration: "1 week" }
      ],
      milestones: ["Site Plan Approved", "Foundation Complete", "Building Enclosed", "Sprinkler System Approved", "Office Space Complete", "Final Inspection"]
    },
    is_system_template: true,
    estimated_duration: '8-14 months',
    estimated_budget: '$2.5M - $8M',
    complexity: 'medium',
    required_permits: ["Site Plan Approval", "Building Permit", "Electrical Permit", "Fire Protection Permit", "Grading Permit", "Development Charges"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },

  // INDUSTRIAL TEMPLATES (5)
  {
    id: '40000000-0000-0000-0000-000000000001',
    name: 'Manufacturing Facility',
    description: 'Industrial manufacturing plant with heavy equipment foundations, overhead cranes, and specialized utilities.',
    category: 'industrial',
    template_data: {
      phases: ["Approvals & Planning", "Site Work", "Foundation & Structure", "Building Systems", "Equipment Installation"],
      default_tasks: [
        { name: "Environmental Assessment", phase: "Approvals & Planning", duration: "12 weeks" },
        { name: "Site Plan Approval", phase: "Approvals & Planning", duration: "16 weeks" },
        { name: "Industrial Building Permit", phase: "Approvals & Planning", duration: "10 weeks" },
        { name: "Crane System Engineering", phase: "Approvals & Planning", duration: "6 weeks" },
        { name: "Site Clearing & Grading", phase: "Site Work", duration: "4 weeks" },
        { name: "Heavy Equipment Foundations", phase: "Foundation & Structure", duration: "8 weeks" },
        { name: "Reinforced Slab", phase: "Foundation & Structure", duration: "6 weeks" },
        { name: "Structural Steel - Heavy Duty", phase: "Foundation & Structure", duration: "12 weeks" },
        { name: "Crane Runway Systems", phase: "Foundation & Structure", duration: "6 weeks" },
        { name: "Three-Phase Power Distribution", phase: "Building Systems", duration: "10 weeks" },
        { name: "Compressed Air Systems", phase: "Building Systems", duration: "4 weeks" },
        { name: "Industrial HVAC", phase: "Building Systems", duration: "8 weeks" },
        { name: "Fire Suppression - Industrial", phase: "Building Systems", duration: "6 weeks" },
        { name: "Overhead Crane Installation", phase: "Equipment Installation", duration: "4 weeks" },
        { name: "Production Equipment Anchoring", phase: "Equipment Installation", duration: "6 weeks" }
      ],
      milestones: ["Environmental Clearance", "Site Plan Approved", "Foundation Complete", "Steel Structure Complete", "Crane Systems Operational", "Final Inspection"]
    },
    is_system_template: true,
    estimated_duration: '18-30 months',
    estimated_budget: '$5M - $20M',
    complexity: 'high',
    required_permits: ["Environmental Assessment", "Site Plan Approval", "Building Permit", "Electrical Permit", "Fire Protection Permit", "Crane Permit", "Occupational Health & Safety Approval"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    name: 'Cold Storage Facility',
    description: 'Refrigerated warehouse with temperature-controlled zones and specialized insulation.',
    category: 'industrial',
    template_data: {
      phases: ["Design & Approvals", "Site Development", "Insulated Structure", "Refrigeration Systems", "Final Systems"],
      default_tasks: [
        { name: "Refrigeration Engineering Design", phase: "Design & Approvals", duration: "8 weeks" },
        { name: "Building Permit", phase: "Design & Approvals", duration: "8 weeks" },
        { name: "Site Preparation", phase: "Site Development", duration: "3 weeks" },
        { name: "Insulated Slab Foundation", phase: "Insulated Structure", duration: "4 weeks" },
        { name: "Insulated Panel Structure", phase: "Insulated Structure", duration: "10 weeks" },
        { name: "Vapor Barriers", phase: "Insulated Structure", duration: "2 weeks" },
        { name: "Refrigeration Plant", phase: "Refrigeration Systems", duration: "8 weeks" },
        { name: "Cold Room Partitions", phase: "Refrigeration Systems", duration: "6 weeks" },
        { name: "Temperature Control Systems", phase: "Refrigeration Systems", duration: "4 weeks" },
        { name: "Loading Dock Airlocks", phase: "Refrigeration Systems", duration: "3 weeks" },
        { name: "Backup Power Systems", phase: "Final Systems", duration: "4 weeks" },
        { name: "Monitoring & Alarms", phase: "Final Systems", duration: "2 weeks" }
      ],
      milestones: ["Design Approved", "Structure Complete", "Refrigeration Installed", "Temperature Test Passed", "Final Inspection"]
    },
    is_system_template: true,
    estimated_duration: '10-16 months',
    estimated_budget: '$4M - $12M',
    complexity: 'high',
    required_permits: ["Building Permit", "Refrigeration System Permit", "Electrical Permit", "Environmental Compliance"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    name: 'Concrete Batch Plant',
    description: 'Aggregate storage, batching equipment, and ready-mix concrete production facility.',
    category: 'industrial',
    template_data: {
      phases: ["Environmental Review", "Site Development", "Equipment Foundations", "Batching Systems", "Environmental Controls"],
      default_tasks: [
        { name: "Environmental Compliance Application", phase: "Environmental Review", duration: "20 weeks" },
        { name: "Aggregate Storage Design", phase: "Environmental Review", duration: "6 weeks" },
        { name: "Site Preparation & Drainage", phase: "Site Development", duration: "4 weeks" },
        { name: "Aggregate Bin Foundations", phase: "Equipment Foundations", duration: "6 weeks" },
        { name: "Mixer Foundation", phase: "Equipment Foundations", duration: "4 weeks" },
        { name: "Aggregate Bins Installation", phase: "Batching Systems", duration: "6 weeks" },
        { name: "Conveyor Systems", phase: "Batching Systems", duration: "4 weeks" },
        { name: "Batching Controls", phase: "Batching Systems", duration: "4 weeks" },
        { name: "Dust Collection System", phase: "Environmental Controls", duration: "4 weeks" },
        { name: "Water Recycling System", phase: "Environmental Controls", duration: "6 weeks" }
      ],
      milestones: ["Environmental Approval", "Site Ready", "Equipment Installed", "Systems Tested", "Operational Clearance"]
    },
    is_system_template: true,
    estimated_duration: '12-18 months',
    estimated_budget: '$3M - $8M',
    complexity: 'high',
    required_permits: ["Environmental Compliance Approval", "Site Plan Approval", "Building Permit", "Electrical Permit", "Water Discharge Permit"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    name: 'Auto Body Shop',
    description: 'Vehicle repair facility with spray booths, ventilation, and hazardous material handling.',
    category: 'industrial',
    template_data: {
      phases: ["Permits & Design", "Building Construction", "Specialized Systems", "Equipment Installation"],
      default_tasks: [
        { name: "Building Permit", phase: "Permits & Design", duration: "6 weeks" },
        { name: "Spray Booth Engineering", phase: "Permits & Design", duration: "4 weeks" },
        { name: "Foundation & Slab", phase: "Building Construction", duration: "4 weeks" },
        { name: "Building Structure", phase: "Building Construction", duration: "10 weeks" },
        { name: "Spray Booth Installation", phase: "Specialized Systems", duration: "6 weeks" },
        { name: "Ventilation & Filtration", phase: "Specialized Systems", duration: "4 weeks" },
        { name: "Compressed Air System", phase: "Specialized Systems", duration: "2 weeks" },
        { name: "Vehicle Lifts", phase: "Equipment Installation", duration: "2 weeks" },
        { name: "Paint Mixing Room", phase: "Equipment Installation", duration: "3 weeks" },
        { name: "Hazmat Storage", phase: "Equipment Installation", duration: "2 weeks" }
      ],
      milestones: ["Permits Approved", "Building Complete", "Spray Booth Certified", "Equipment Operational", "Final Inspection"]
    },
    is_system_template: true,
    estimated_duration: '6-10 months',
    estimated_budget: '$600,000 - $1.5M',
    complexity: 'medium',
    required_permits: ["Building Permit", "Spray Booth Permit", "Environmental Permit", "Hazmat Storage Permit", "Fire Department Approval"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '40000000-0000-0000-0000-000000000005',
    name: 'Food Processing Plant',
    description: 'Food-grade facility with HACCP compliance, refrigeration, and sanitary design.',
    category: 'industrial',
    template_data: {
      phases: ["Regulatory Approvals", "Building Construction", "Process Equipment", "Sanitation Systems", "Compliance Testing"],
      default_tasks: [
        { name: "CFIA Consultation", phase: "Regulatory Approvals", duration: "12 weeks" },
        { name: "Building Permit", phase: "Regulatory Approvals", duration: "8 weeks" },
        { name: "Food-Grade Slab & Drains", phase: "Building Construction", duration: "6 weeks" },
        { name: "Insulated Wall Panels", phase: "Building Construction", duration: "8 weeks" },
        { name: "Epoxy Floor Coating", phase: "Building Construction", duration: "2 weeks" },
        { name: "Processing Equipment", phase: "Process Equipment", duration: "10 weeks" },
        { name: "Refrigeration Systems", phase: "Process Equipment", duration: "8 weeks" },
        { name: "Sanitary Plumbing", phase: "Sanitation Systems", duration: "6 weeks" },
        { name: "Clean-in-Place Systems", phase: "Sanitation Systems", duration: "4 weeks" },
        { name: "HACCP Validation", phase: "Compliance Testing", duration: "4 weeks" },
        { name: "CFIA Inspection", phase: "Compliance Testing", duration: "2 weeks" }
      ],
      milestones: ["CFIA Pre-Approval", "Building Complete", "Equipment Installed", "Sanitation Validated", "CFIA Approval", "Operational License"]
    },
    is_system_template: true,
    estimated_duration: '14-24 months',
    estimated_budget: '$6M - $18M',
    complexity: 'high',
    required_permits: ["CFIA Approval", "Building Permit", "Health Department Approval", "Environmental Permit", "Water Discharge Permit"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },

  // SAFETY TEMPLATES (5)
  {
    id: '50000000-0000-0000-0000-000000000001',
    name: 'Site Safety Plan - Residential',
    description: 'Comprehensive safety plan template for residential construction projects in Ontario.',
    category: 'safety',
    template_data: {
      phases: ["Risk Assessment", "Safety Planning", "Implementation", "Monitoring"],
      default_tasks: [
        { name: "Hazard Identification", phase: "Risk Assessment", duration: "1 week" },
        { name: "PPE Requirements", phase: "Safety Planning", duration: "included" },
        { name: "Emergency Procedures", phase: "Safety Planning", duration: "3 days" },
        { name: "Scaffolding Safety Plan", phase: "Safety Planning", duration: "2 days" },
        { name: "Fall Protection Plan", phase: "Safety Planning", duration: "2 days" },
        { name: "Site Safety Orientation", phase: "Implementation", duration: "ongoing" },
        { name: "Daily Safety Inspections", phase: "Monitoring", duration: "ongoing" },
        { name: "Weekly Safety Meetings", phase: "Monitoring", duration: "ongoing" }
      ],
      milestones: ["Safety Plan Approved", "Site Orientation Complete", "Monthly Safety Audit"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration',
    estimated_budget: '$5,000 - $15,000',
    complexity: 'medium',
    required_permits: ["WSIB Coverage", "Safety Plan Approval"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    name: 'Confined Space Entry Program',
    description: 'Safety procedures and checklists for confined space work in construction.',
    category: 'safety',
    template_data: {
      phases: ["Assessment", "Training", "Procedures", "Execution"],
      default_tasks: [
        { name: "Confined Space Identification", phase: "Assessment", duration: "1 day" },
        { name: "Atmosphere Testing Procedures", phase: "Procedures", duration: "1 day" },
        { name: "Entry Permits", phase: "Procedures", duration: "ongoing" },
        { name: "Rescue Plan", phase: "Procedures", duration: "2 days" },
        { name: "Worker Training", phase: "Training", duration: "1 day" },
        { name: "Attendant Assignment", phase: "Execution", duration: "ongoing" }
      ],
      milestones: ["Program Developed", "Team Trained", "First Entry Completed"]
    },
    is_system_template: true,
    estimated_duration: 'As Required',
    estimated_budget: '$8,000 - $20,000',
    complexity: 'high',
    required_permits: ["Confined Space Entry Permit", "Gas Testing Certification"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '50000000-0000-0000-0000-000000000003',
    name: 'Fall Protection System',
    description: 'Complete fall protection plan for work at heights over 3 meters.',
    category: 'safety',
    template_data: {
      phases: ["Planning", "Installation", "Training", "Inspection"],
      default_tasks: [
        { name: "Fall Hazard Assessment", phase: "Planning", duration: "2 days" },
        { name: "Guardrail System Design", phase: "Planning", duration: "1 week" },
        { name: "Anchor Point Installation", phase: "Installation", duration: "1 week" },
        { name: "Safety Net Systems", phase: "Installation", duration: "3 days" },
        { name: "Working at Heights Training", phase: "Training", duration: "1 day" },
        { name: "Daily Equipment Inspection", phase: "Inspection", duration: "ongoing" }
      ],
      milestones: ["Plan Approved", "System Installed", "Workers Certified", "Daily Inspections"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration',
    estimated_budget: '$15,000 - $40,000',
    complexity: 'high',
    required_permits: ["Working at Heights Training Certification", "Fall Protection Plan Approval"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '50000000-0000-0000-0000-000000000004',
    name: 'Traffic Management Plan',
    description: 'Site access, parking, and public safety for urban construction sites.',
    category: 'safety',
    template_data: {
      phases: ["Planning", "Permits", "Implementation", "Monitoring"],
      default_tasks: [
        { name: "Site Access Design", phase: "Planning", duration: "1 week" },
        { name: "Pedestrian Safety Measures", phase: "Planning", duration: "3 days" },
        { name: "Municipal Road Occupancy Permit", phase: "Permits", duration: "4 weeks" },
        { name: "Signage & Barriers Installation", phase: "Implementation", duration: "1 week" },
        { name: "Flagging Personnel", phase: "Implementation", duration: "ongoing" },
        { name: "Daily Traffic Inspections", phase: "Monitoring", duration: "ongoing" }
      ],
      milestones: ["Plan Approved", "Permit Issued", "Barriers Installed", "Site Secure"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration',
    estimated_budget: '$10,000 - $50,000',
    complexity: 'medium',
    required_permits: ["Road Occupancy Permit", "Traffic Control Permit"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '50000000-0000-0000-0000-000000000005',
    name: 'Asbestos Abatement Project',
    description: 'Safe removal and disposal of asbestos-containing materials.',
    category: 'safety',
    template_data: {
      phases: ["Assessment", "Planning", "Containment", "Removal", "Clearance"],
      default_tasks: [
        { name: "Asbestos Survey", phase: "Assessment", duration: "1 week" },
        { name: "Abatement Plan", phase: "Planning", duration: "2 weeks" },
        { name: "Ministry Notification", phase: "Planning", duration: "2 weeks" },
        { name: "Containment Setup", phase: "Containment", duration: "1 week" },
        { name: "Negative Pressure System", phase: "Containment", duration: "2 days" },
        { name: "Material Removal", phase: "Removal", duration: "varies" },
        { name: "Disposal", phase: "Removal", duration: "ongoing" },
        { name: "Air Monitoring", phase: "Clearance", duration: "ongoing" },
        { name: "Final Clearance Testing", phase: "Clearance", duration: "1 week" }
      ],
      milestones: ["Survey Complete", "Permit Issued", "Containment Ready", "Removal Complete", "Clearance Certificate"]
    },
    is_system_template: true,
    estimated_duration: '2-8 weeks',
    estimated_budget: '$20,000 - $150,000',
    complexity: 'high',
    required_permits: ["Asbestos Abatement Permit", "MOECP Notification", "Waste Disposal Permit"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },

  // FINANCE TEMPLATES (5)
  {
    id: '60000000-0000-0000-0000-000000000001',
    name: 'Construction Budget Template',
    description: 'Comprehensive budget breakdown for construction projects with Ontario-specific costs.',
    category: 'finance',
    template_data: {
      phases: ["Pre-Construction Costs", "Direct Construction Costs", "Soft Costs", "Contingencies"],
      default_tasks: [
        { name: "Site Acquisition/Leasing", phase: "Pre-Construction Costs", duration: "n/a" },
        { name: "Design & Engineering Fees", phase: "Pre-Construction Costs", duration: "n/a" },
        { name: "Permits & Development Charges", phase: "Pre-Construction Costs", duration: "n/a" },
        { name: "Labour Costs", phase: "Direct Construction Costs", duration: "n/a" },
        { name: "Materials", phase: "Direct Construction Costs", duration: "n/a" },
        { name: "Equipment Rental", phase: "Direct Construction Costs", duration: "n/a" },
        { name: "Subcontractor Fees", phase: "Direct Construction Costs", duration: "n/a" },
        { name: "Legal Fees", phase: "Soft Costs", duration: "n/a" },
        { name: "Insurance", phase: "Soft Costs", duration: "n/a" },
        { name: "Financing Costs", phase: "Soft Costs", duration: "n/a" },
        { name: "Contingency (5-10%)", phase: "Contingencies", duration: "n/a" }
      ],
      milestones: ["Budget Approved", "Monthly Budget Review", "Final Reconciliation"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration',
    estimated_budget: 'Variable',
    complexity: 'medium',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    name: 'Cash Flow Projection',
    description: 'Monthly cash flow forecast for construction project funding.',
    category: 'finance',
    template_data: {
      phases: ["Income Projection", "Expense Timing", "Cash Flow Analysis"],
      default_tasks: [
        { name: "Initial Capital", phase: "Income Projection", duration: "month 1" },
        { name: "Draw Schedule", phase: "Income Projection", duration: "ongoing" },
        { name: "Monthly Expenses", phase: "Expense Timing", duration: "ongoing" },
        { name: "Peak Cash Requirement", phase: "Cash Flow Analysis", duration: "identified" },
        { name: "Contingency Reserve", phase: "Cash Flow Analysis", duration: "maintained" }
      ],
      milestones: ["Cash Flow Plan Approved", "Monthly Review", "Peak Funding Secured"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration',
    estimated_budget: 'Variable',
    complexity: 'medium',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '60000000-0000-0000-0000-000000000003',
    name: 'Change Order Management',
    description: 'Process for tracking and approving construction change orders and cost variations.',
    category: 'finance',
    template_data: {
      phases: ["Change Identification", "Cost Estimation", "Approval", "Implementation"],
      default_tasks: [
        { name: "Change Request Form", phase: "Change Identification", duration: "as needed" },
        { name: "Impact Assessment", phase: "Cost Estimation", duration: "3 days" },
        { name: "Pricing from Trades", phase: "Cost Estimation", duration: "1 week" },
        { name: "Owner Approval", phase: "Approval", duration: "varies" },
        { name: "Contract Amendment", phase: "Approval", duration: "3 days" },
        { name: "Budget Update", phase: "Implementation", duration: "1 day" },
        { name: "Schedule Adjustment", phase: "Implementation", duration: "1 day" }
      ],
      milestones: ["Change Log Created", "Approval Process Defined", "Monthly Change Order Report"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration',
    estimated_budget: 'Variable',
    complexity: 'low',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '60000000-0000-0000-0000-000000000004',
    name: 'Holdback Management (Ontario)',
    description: 'Ontario Construction Act holdback tracking and release process.',
    category: 'finance',
    template_data: {
      phases: ["Holdback Retention", "Lien Period", "Release Process"],
      default_tasks: [
        { name: "10% Holdback Calculation", phase: "Holdback Retention", duration: "ongoing" },
        { name: "Progress Payment with Holdback", phase: "Holdback Retention", duration: "monthly" },
        { name: "Substantial Completion Certificate", phase: "Lien Period", duration: "at completion" },
        { name: "45-Day Lien Period", phase: "Lien Period", duration: "45 days" },
        { name: "Lien Search", phase: "Release Process", duration: "after 45 days" },
        { name: "Holdback Release", phase: "Release Process", duration: "if no liens" },
        { name: "Final Payment", phase: "Release Process", duration: "after release" }
      ],
      milestones: ["Project Start", "Substantial Completion", "Lien Period Expires", "Holdback Released"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration + 45 days',
    estimated_budget: '10% of Contract Value',
    complexity: 'medium',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '60000000-0000-0000-0000-000000000005',
    name: 'HST & Tax Planning',
    description: 'HST rebate and tax planning for Ontario construction projects.',
    category: 'finance',
    template_data: {
      phases: ["Tax Planning", "HST Tracking", "Rebate Application"],
      default_tasks: [
        { name: "Determine HST Rebate Eligibility", phase: "Tax Planning", duration: "pre-project" },
        { name: "HST on Materials", phase: "HST Tracking", duration: "ongoing" },
        { name: "HST on Labour", phase: "HST Tracking", duration: "ongoing" },
        { name: "HST on Services", phase: "HST Tracking", duration: "ongoing" },
        { name: "New Housing Rebate (if applicable)", phase: "Rebate Application", duration: "at completion" },
        { name: "Rental Property Rebate (if applicable)", phase: "Rebate Application", duration: "at completion" },
        { name: "CRA Submission", phase: "Rebate Application", duration: "within deadline" }
      ],
      milestones: ["Tax Strategy Defined", "HST Records Maintained", "Rebate Submitted", "Rebate Received"]
    },
    is_system_template: true,
    estimated_duration: 'Project Duration + Filing',
    estimated_budget: 'Variable',
    complexity: 'medium',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },

  // MAINTENANCE TEMPLATES (5)
  {
    id: '70000000-0000-0000-0000-000000000001',
    name: 'Building Preventive Maintenance',
    description: 'Annual maintenance schedule for commercial and residential buildings.',
    category: 'maintenance',
    template_data: {
      phases: ["Monthly Tasks", "Quarterly Tasks", "Annual Tasks"],
      default_tasks: [
        { name: "HVAC Filter Change", phase: "Monthly Tasks", duration: "monthly" },
        { name: "Fire Extinguisher Check", phase: "Monthly Tasks", duration: "monthly" },
        { name: "HVAC System Service", phase: "Quarterly Tasks", duration: "quarterly" },
        { name: "Roof Inspection", phase: "Quarterly Tasks", duration: "quarterly" },
        { name: "Plumbing System Check", phase: "Quarterly Tasks", duration: "quarterly" },
        { name: "Electrical Panel Inspection", phase: "Annual Tasks", duration: "annual" },
        { name: "Fire Alarm System Test", phase: "Annual Tasks", duration: "annual" },
        { name: "Parking Lot Seal Coating", phase: "Annual Tasks", duration: "annual" },
        { name: "Window & Door Maintenance", phase: "Annual Tasks", duration: "annual" }
      ],
      milestones: ["Maintenance Schedule Created", "Quarterly Review", "Annual Inspection Complete"]
    },
    is_system_template: true,
    estimated_duration: 'Ongoing',
    estimated_budget: '$10,000 - $50,000/year',
    complexity: 'low',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    name: 'Warranty Period Management',
    description: '1-year warranty tracking and deficiency resolution for new construction.',
    category: 'maintenance',
    template_data: {
      phases: ["Initial Inspection", "Deficiency Tracking", "Warranty Repairs", "Final Inspection"],
      default_tasks: [
        { name: "Pre-Delivery Inspection (PDI)", phase: "Initial Inspection", duration: "at completion" },
        { name: "Deficiency List Creation", phase: "Deficiency Tracking", duration: "after PDI" },
        { name: "30-Day Follow-Up", phase: "Deficiency Tracking", duration: "30 days" },
        { name: "6-Month Inspection", phase: "Deficiency Tracking", duration: "6 months" },
        { name: "Emergency Repairs", phase: "Warranty Repairs", duration: "as needed" },
        { name: "Scheduled Deficiency Repairs", phase: "Warranty Repairs", duration: "ongoing" },
        { name: "11-Month Pre-Expiry Inspection", phase: "Final Inspection", duration: "11 months" },
        { name: "Final Deficiency Completion", phase: "Final Inspection", duration: "before 1 year" },
        { name: "Warranty Closeout", phase: "Final Inspection", duration: "at 1 year" }
      ],
      milestones: ["PDI Complete", "30-Day Items Resolved", "6-Month Review", "1-Year Warranty Expires"]
    },
    is_system_template: true,
    estimated_duration: '1 Year',
    estimated_budget: '1-2% of Construction Cost',
    complexity: 'medium',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '70000000-0000-0000-0000-000000000003',
    name: 'HVAC Seasonal Maintenance',
    description: 'Spring and fall HVAC system maintenance for optimal performance.',
    category: 'maintenance',
    template_data: {
      phases: ["Spring Preparation", "Fall Preparation", "Year-Round Monitoring"],
      default_tasks: [
        { name: "Cooling System Inspection", phase: "Spring Preparation", duration: "1 day" },
        { name: "Refrigerant Check", phase: "Spring Preparation", duration: "included" },
        { name: "Condenser Coil Cleaning", phase: "Spring Preparation", duration: "included" },
        { name: "Heating System Inspection", phase: "Fall Preparation", duration: "1 day" },
        { name: "Burner/Heat Exchanger Check", phase: "Fall Preparation", duration: "included" },
        { name: "Thermostat Calibration", phase: "Fall Preparation", duration: "included" },
        { name: "Monthly Filter Changes", phase: "Year-Round Monitoring", duration: "monthly" },
        { name: "System Performance Monitoring", phase: "Year-Round Monitoring", duration: "ongoing" }
      ],
      milestones: ["Spring Service Complete", "Fall Service Complete", "Annual Efficiency Report"]
    },
    is_system_template: true,
    estimated_duration: 'Ongoing',
    estimated_budget: '$500 - $2,000/year',
    complexity: 'low',
    required_permits: ["TSSA Certification (for gas equipment)"],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '70000000-0000-0000-0000-000000000004',
    name: 'Parking Lot Maintenance',
    description: 'Annual parking lot inspection, repair, and resurfacing program.',
    category: 'maintenance',
    template_data: {
      phases: ["Spring Inspection", "Repairs", "Preventive Maintenance", "Winter Preparation"],
      default_tasks: [
        { name: "Post-Winter Damage Assessment", phase: "Spring Inspection", duration: "1 day" },
        { name: "Crack Sealing", phase: "Repairs", duration: "1-2 days" },
        { name: "Pothole Patching", phase: "Repairs", duration: "1-2 days" },
        { name: "Line Painting", phase: "Repairs", duration: "1 day" },
        { name: "Seal Coating", phase: "Preventive Maintenance", duration: "every 2-3 years" },
        { name: "Drainage Clearing", phase: "Preventive Maintenance", duration: "spring/fall" },
        { name: "Catch Basin Cleaning", phase: "Preventive Maintenance", duration: "annual" },
        { name: "Snow Removal Contract", phase: "Winter Preparation", duration: "before winter" }
      ],
      milestones: ["Spring Assessment Complete", "Summer Repairs Done", "Line Painting Complete", "Winter-Ready"]
    },
    is_system_template: true,
    estimated_duration: 'Ongoing',
    estimated_budget: '$3,000 - $15,000/year',
    complexity: 'low',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  },
  {
    id: '70000000-0000-0000-0000-000000000005',
    name: 'Roof Maintenance Program',
    description: 'Inspection and maintenance schedule to extend roof life and prevent leaks.',
    category: 'maintenance',
    template_data: {
      phases: ["Biannual Inspections", "Preventive Maintenance", "Repairs", "Documentation"],
      default_tasks: [
        { name: "Spring Roof Inspection", phase: "Biannual Inspections", duration: "1 day" },
        { name: "Fall Roof Inspection", phase: "Biannual Inspections", duration: "1 day" },
        { name: "Post-Storm Inspection", phase: "Biannual Inspections", duration: "as needed" },
        { name: "Drain & Gutter Cleaning", phase: "Preventive Maintenance", duration: "spring/fall" },
        { name: "Membrane Inspection", phase: "Preventive Maintenance", duration: "included" },
        { name: "Flashing Check", phase: "Preventive Maintenance", duration: "included" },
        { name: "Minor Leak Repairs", phase: "Repairs", duration: "as needed" },
        { name: "Membrane Patching", phase: "Repairs", "duration": "as needed" },
        { name: "Maintenance Log", phase: "Documentation", duration: "ongoing" },
        { name: "Warranty Compliance Documentation", phase: "Documentation", duration: "ongoing" }
      ],
      milestones: ["Spring Inspection Complete", "Fall Inspection Complete", "Repairs Up to Date", "Warranty Maintained"]
    },
    is_system_template: true,
    estimated_duration: 'Ongoing',
    estimated_budget: '$2,000 - $10,000/year',
    complexity: 'medium',
    required_permits: [],
    ontario_building_code_version: 'OBC 2024',
    is_active: true
  }
];

export async function seedOntarioTemplates() {
  try {
    console.log('Starting template seeding...');

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData?.user) throw new Error('You must be logged in to load templates.');
    const userId = authData.user.id;

    let successCount = 0;
    const failures: Array<{ id: string; name: string; message: string }> = [];
    
    for (const template of ontarioConstructionTemplates) {
      // IMPORTANT: Only send columns that exist in the DB schema.
      // (Avoid schema-cache errors for fields like `ontario_building_code_version`.)
      const payload = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        template_data: template.template_data,
        is_system_template: template.is_system_template ?? true,
        is_active: template.is_active ?? true,
        is_public: true,
        created_by: userId,
        estimated_duration: template.estimated_duration ?? null,
        // `estimated_budget` is numeric in DB but many seed values are ranges (string) -> keep null.
        estimated_budget: null,
        complexity: template.complexity ?? null,
        required_permits: template.required_permits ?? null,
      };

      const { error } = await supabase
        .from('project_templates')
        .upsert([payload], {
          onConflict: 'id',
          ignoreDuplicates: false,
        });
      
      if (error) {
        console.error(`Error seeding template ${template.name}:`, error);
        failures.push({
          id: template.id,
          name: template.name,
          message: error.message ?? 'Unknown error',
        });
      } else {
        console.log(`✓ Seeded: ${template.name}`);
        successCount++;
      }
    }
    
    console.log('Template seeding complete!');

    // Treat as success if we seeded at least 1 template.
    return {
      success: successCount > 0,
      count: successCount,
      failed: failures.length,
      failures,
    };
  } catch (error) {
    console.error('Error in seedOntarioTemplates:', error);
    return { success: false, error };
  }
}
