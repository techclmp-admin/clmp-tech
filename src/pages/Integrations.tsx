import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Sage50Integration from '@/components/Sage50Integration';
import SlackNotifications from '@/components/SlackNotifications';
import { MobilePageWrapper, MobileSegmentedControl } from '@/components/mobile';
import { 
  ExternalLink, 
  Zap, 
  Database, 
  FileText, 
  MessageSquare,
  Cloud,
  Grid3X3
} from 'lucide-react';

const Integrations = () => {
  const [activeTab, setActiveTab] = useState('sage50');

  const tabOptions = [
    { value: 'sage50', label: 'Sage 50', icon: <Database className="h-5 w-5" /> },
    { value: 'slack', label: 'Slack', icon: <MessageSquare className="h-5 w-5" /> },
    { value: 'quickbooks', label: 'QuickBooks', icon: <Database className="h-5 w-5" /> },
    { value: 'overview', label: 'All', icon: <Grid3X3 className="h-5 w-5" /> },
  ];

  return (
    <MobilePageWrapper
      title="Integrations"
      subtitle="Connect your construction management platform with external tools and services"
    >
      {/* Mobile Segmented Control */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          variant="card"
        />
      </div>

      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block space-y-4">
        <TabsList>
          <TabsTrigger value="sage50">Sage 50</TabsTrigger>
          <TabsTrigger value="slack">Slack</TabsTrigger>
          <TabsTrigger value="quickbooks">QuickBooks</TabsTrigger>
          <TabsTrigger value="overview">All Integrations</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      {activeTab === 'quickbooks' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              QuickBooks Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600">
                <Database className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  QuickBooks integration is currently being configured. 
                  Please check back later or contact support for more information.
                </p>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Under Configuration
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'sage50' && <Sage50Integration />}

      {activeTab === 'slack' && <SlackNotifications />}

      {activeTab === 'overview' && <IntegrationsOverview />}
    </MobilePageWrapper>
  );
};

const IntegrationsOverview = () => {
  const integrationCategories = [
    {
      id: 'accounting',
      name: 'Accounting & Finance',
      icon: Database,
      integrations: [
        {
          name: 'Sage 50',
          description: 'Sync financial data with Sage 50 accounting software',
          status: 'available'
        },
        {
          name: 'QuickBooks',
          description: 'Export projects, expenses, and invoices to QuickBooks',
          status: 'coming_soon'
        },
        {
          name: 'Xero',
          description: 'Sync financial data with Xero accounting software',
          status: 'coming_soon'
        }
      ]
    },
    {
      id: 'communication',
      name: 'Communication',
      icon: MessageSquare,
      integrations: [
        {
          name: 'Slack',
          description: 'Send project notifications to Slack channels',
          status: 'available'
        },
        {
          name: 'Microsoft Teams',
          description: 'Integrate with Teams for project collaboration',
          status: 'coming_soon'
        }
      ]
    },
    {
      id: 'project_management',
      name: 'Project Management',
      icon: FileText,
      integrations: [
        {
          name: 'Monday.com',
          description: 'Sync project tasks and timelines',
          status: 'coming_soon'
        },
        {
          name: 'Asana',
          description: 'Import and export project data',
          status: 'coming_soon'
        }
      ]
    },
    {
      id: 'storage',
      name: 'File Storage',
      icon: Cloud,
      integrations: [
        {
          name: 'Google Drive',
          description: 'Store and sync project files',
          status: 'coming_soon'
        },
        {
          name: 'Dropbox',
          description: 'Backup project documents automatically',
          status: 'coming_soon'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {integrationCategories.map((category) => {
        const IconComponent = category.icon;
        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.integrations.map((integration) => (
                  <IntegrationCard 
                    key={integration.name} 
                    integration={integration}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const IntegrationCard = ({ integration }: { integration: any }) => {
  return (
    <div className={`p-4 border rounded-lg ${integration.status === 'available' ? 'cursor-pointer hover:shadow-md' : 'opacity-60'} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{integration.name}</h3>
        {integration.status === 'coming_soon' ? (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Coming Soon
          </span>
        ) : (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Available
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {integration.description}
      </p>
      {integration.status === 'available' ? (
        <div className="flex items-center text-primary text-sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Available Now
        </div>
      ) : (
        <div className="flex items-center text-muted-foreground text-sm">
          <Zap className="h-4 w-4 mr-2" />
          Coming Soon
        </div>
      )}
    </div>
  );
};

export default Integrations;