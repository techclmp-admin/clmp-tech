import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import NPSSurvey from '@/components/NPSSurvey';

import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobilePageWrapper, MobileSegmentedControl } from '@/components/mobile';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  HelpCircle, 
  FileText, 
  ThumbsUp, 
  ThumbsDown,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Video,
  Send,
  Book,
  Ticket,
  BarChart3,
  Rocket,
  FolderOpen,
  DollarSign,
  Users,
  Shield,
  CreditCard,
  Bug,
  Plug,
  ExternalLink,
  Loader2
} from 'lucide-react';

const SupportPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('knowledge-base');

  // Fetch support categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['support-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch FAQs
  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['support-faqs', selectedCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('support_faqs')
        .select('*, support_categories(name, color)')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('sort_order');

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch user's tickets
  const { data: userTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['user-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const tabOptions = [
    { value: 'knowledge-base', label: 'Knowledge', icon: <Book className="h-5 w-5" /> },
    { value: 'user-manual', label: 'Manual', icon: <FileText className="h-5 w-5" /> },
    { value: 'faqs', label: 'FAQs', icon: <HelpCircle className="h-5 w-5" /> },
    { value: 'my-tickets', label: 'Tickets', icon: <Ticket className="h-5 w-5" /> },
    { value: 'feedback', label: 'Feedback', icon: <MessageCircle className="h-5 w-5" /> },
    { value: 'nps', label: 'NPS', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <MobilePageWrapper
      title="Help & Support"
      subtitle="Get help, find answers, and contact our support team"
      actions={
        <CreateTicketModal categories={categories || []} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] })} />
      }
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <QuickActionCard
          icon={MessageCircle}
          title="Live Chat"
          description="Chat with our support team"
          action={() => toast({ 
            title: "Live Chat", 
            description: "Live chat feature coming soon! Please use Email or Phone support for now.",
          })}
          color="blue"
        />
        <QuickActionCard
          icon={Mail}
          title="Email Support"
          description="info@clmptech.ca"
          action={() => {
            window.open('mailto:info@clmptech.ca?subject=Support%20Request%20-%20CLMP');
            toast({ 
              title: "Email Support", 
              description: "Opening your email client...",
            });
          }}
          color="green"
        />
        <QuickActionCard
          icon={Phone}
          title="Phone Support"
          description="+1 (705) 985-9688"
          action={() => {
            window.open('tel:+17059859688');
            toast({ 
              title: "Phone Support", 
              description: "Mon-Fri: 9AM - 5PM EST",
            });
          }}
          color="orange"
        />
        <QuickActionCard
          icon={Video}
          title="Video Call"
          description="Schedule a video call"
          action={() => toast({ 
            title: "Video Call", 
            description: "Video call scheduling coming soon! Contact us by email to arrange a call.",
          })}
          color="purple"
        />
      </div>

      {/* Mobile Segmented Control */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          variant="card"
          columns={4}
        />
      </div>

      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          <TabsTrigger value="user-manual">User Manual</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="nps">NPS Survey</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      {activeTab === 'knowledge-base' && (
        <KnowledgeBaseSection 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          categories={categories || []}
          isLoading={categoriesLoading}
        />
      )}

      {activeTab === 'user-manual' && <UserManualSection />}

      {activeTab === 'faqs' && (
        <FAQSection 
          faqs={faqs || []} 
          categories={categories || []}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isLoading={faqsLoading}
        />
      )}

      {activeTab === 'my-tickets' && (
        <MyTicketsSection 
          tickets={userTickets || []} 
          categories={categories || []}
          isLoading={ticketsLoading}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['user-support-tickets'] })}
        />
      )}

      {activeTab === 'feedback' && <FeedbackSection />}

      {activeTab === 'nps' && <NPSSurvey />}

      
    </MobilePageWrapper>
  );
};

interface QuickActionCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

const QuickActionCard = ({ icon: Icon, title, description, action, color }: QuickActionCardProps) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'green': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'orange': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'purple': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={action}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getColorClasses(color)}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    Rocket: Rocket,
    FolderOpen: FolderOpen,
    DollarSign: DollarSign,
    Users: Users,
    Shield: Shield,
    CreditCard: CreditCard,
    Bug: Bug,
    Plug: Plug,
    HelpCircle: HelpCircle,
  };
  return icons[iconName] || HelpCircle;
};

interface KnowledgeBaseSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: any[];
  isLoading: boolean;
}

const KnowledgeBaseSection = ({ searchQuery, setSearchQuery, categories, isLoading }: KnowledgeBaseSectionProps) => {
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['support-articles', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('support_articles')
        .select('*, support_categories(name, color)')
        .eq('is_published', true)
        .order('featured', { ascending: false })
        .order('view_count', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Browse by Category</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No categories available</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Popular Articles</h3>
        {articlesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article: any) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No articles found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const ArticleCard = ({ article }: { article: any }) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium leading-tight">{article.title}</h4>
          {article.featured && (
            <Badge variant="outline" className="ml-2 shrink-0">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {article.excerpt || (article.content?.substring(0, 150) + '...')}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{article.view_count || 0} views</span>
          {article.support_categories?.name && (
            <Badge variant="secondary">
              {article.support_categories.name}
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface FAQSectionProps {
  faqs: any[];
  categories: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  isLoading: boolean;
}

const FAQSection = ({ faqs, categories, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, isLoading }: FAQSectionProps) => {
  const featuredFaqs = faqs.filter(faq => faq.is_featured);
  const regularFaqs = faqs.filter(faq => !faq.is_featured);

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No FAQs Found</h4>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `No results for "${searchQuery}"` : 'FAQs will appear here once added'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Featured FAQs */}
          {featuredFaqs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Featured Questions</h3>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {featuredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3 flex-1 mr-4">
                        <span className="flex-1">{faq.question}</span>
                        {faq.support_categories?.name && (
                          <Badge variant="secondary" className="shrink-0">
                            {faq.support_categories.name}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <p className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">Was this helpful?</span>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* All FAQs */}
          {regularFaqs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">All Frequently Asked Questions</h3>
              
              <Accordion type="single" collapsible className="w-full">
                {regularFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3 flex-1 mr-4">
                        <span className="flex-1">{faq.question}</span>
                        {faq.support_categories?.name && (
                          <Badge variant="secondary" className="shrink-0">
                            {faq.support_categories.name}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <p className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">Was this helpful?</span>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface MyTicketsSectionProps {
  tickets: any[];
  categories: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

const MyTicketsSection = ({ tickets, categories, isLoading, onRefresh }: MyTicketsSectionProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">My Support Tickets</h3>
      <CreateTicketModal categories={categories} onSuccess={onRefresh} />
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ) : tickets.length === 0 ? (
      <Card>
        <CardContent className="p-8 text-center">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-medium mb-2">No Support Tickets Yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first support ticket to get help from our team
          </p>
          <CreateTicketModal categories={categories} onSuccess={onRefresh} />
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    )}
  </div>
);

const TicketCard = ({ ticket }: { ticket: any }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Open</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
      case 'resolved': return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Resolved</Badge>;
      case 'closed': return <Badge variant="secondary">Closed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
      case 'high': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">High</Badge>;
      case 'normal': case 'medium': return <Badge variant="secondary">Normal</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const status = ticket.ticket_status || ticket.status || 'open';
  const priority = ticket.priority_level || ticket.priority || 'normal';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="font-medium text-sm">
              {ticket.ticket_number || `#${ticket.id.substring(0, 8)}`}
            </span>
            {getStatusBadge(status)}
            {getPriorityBadge(priority)}
          </div>
          <span className="text-sm text-muted-foreground">
            {new Date(ticket.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="font-medium mb-2">{ticket.subject}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {ticket.description}
        </p>
        <div className="flex items-center justify-between">
          {ticket.ticket_category && (
            <Badge variant="outline">{ticket.ticket_category}</Badge>
          )}
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface CreateTicketModalProps {
  categories: any[];
  onSuccess?: () => void;
}

const CreateTicketModal = ({ categories = [], onSuccess }: CreateTicketModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    ticket_category: '',
    priority_level: 'normal'
  });
  const { toast } = useToast();

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof formData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      
      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
      
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          subject: ticketData.subject,
          description: ticketData.description,
          ticket_category: ticketData.ticket_category,
          priority_level: ticketData.priority_level,
          priority: ticketData.priority_level,
          ticket_number: ticketNumber,
          ticket_status: 'open',
          status: 'open',
          user_id: user.user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been created successfully.",
      });
      setIsOpen(false);
      setFormData({ subject: '', description: '', ticket_category: '', priority_level: 'normal' });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Ticket
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <CardDescription>Describe your issue and we'll get back to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={formData.ticket_category} 
                  onValueChange={(value) => setFormData({ ...formData, ticket_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={formData.priority_level} 
                  onValueChange={(value) => setFormData({ ...formData, priority_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait</SelectItem>
                    <SelectItem value="normal">Normal - Standard priority</SelectItem>
                    <SelectItem value="high">High - Affecting work</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide as much detail as possible..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createTicketMutation.mutate(formData)}
                  disabled={!formData.subject || !formData.description || createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Create Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

const FeedbackSection = () => {
  const [formData, setFormData] = useState({
    feedback_type: 'general_feedback',
    title: '',
    description: '',
    priority: 'medium'
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_feedback')
        .insert({
          feedback_type: formData.feedback_type,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          user_id: user.user?.id
        });
      
      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We appreciate your input.",
      });
      setFormData({ feedback_type: 'general_feedback', title: '', description: '', priority: 'medium' });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Share Your Feedback</h3>
        <p className="text-muted-foreground">Help us improve by sharing your thoughts and suggestions</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Feedback Type</label>
            <Select 
              value={formData.feedback_type} 
              onValueChange={(value) => setFormData({ ...formData, feedback_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug_report">🐛 Bug Report</SelectItem>
                <SelectItem value="feature_request">✨ Feature Request</SelectItem>
                <SelectItem value="general_feedback">💬 General Feedback</SelectItem>
                <SelectItem value="compliment">👏 Compliment</SelectItem>
                <SelectItem value="complaint">⚠️ Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief summary of your feedback"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide detailed feedback to help us understand your perspective..."
              rows={5}
            />
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!formData.title || !formData.description || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const UserManualSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const manualSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      description: 'New to CLMP? Start here for basic setup and orientation',
      steps: [
        { title: 'Creating Your Account', content: 'Sign up with your email address. You will receive a 30-day free trial with full access to all features. No credit card required.' },
        { title: 'Setting Up Your Profile', content: 'Navigate to Settings > Profile to add your name, company, phone number, and profile photo. This information appears when you collaborate with team members.' },
        { title: 'Creating Your First Project', content: 'Go to Projects and click "New Project". Fill in the project name, description, location, dates, and budget. You can use templates for faster setup.' },
        { title: 'Inviting Team Members', content: 'Visit the Team page and click "Invite Member". Enter their email and assign a role (Admin, Project Manager, Team Member, Viewer).' }
      ]
    },
    {
      id: 'projects',
      title: 'Project Management',
      icon: FolderOpen,
      description: 'Learn how to create, manage, and organize your construction projects',
      steps: [
        { title: 'Project Dashboard', content: 'Each project has a dashboard showing tasks, budget status, team members, and recent activity. Access it by clicking on any project card.' },
        { title: 'Tasks & Kanban Board', content: 'Create tasks in the Tasks tab. Drag and drop between columns (To Do, In Progress, Done) to update status. Set due dates and assign team members.' },
        { title: 'Project Files', content: 'Upload documents, drawings, photos, and other files in the Files tab. Organize files into folders and share with team members.' },
        { title: 'Project Templates', content: 'Save time by using pre-built templates or creating your own. Templates include tasks, milestones, and default settings.' }
      ]
    },
    {
      id: 'budget',
      title: 'Budget & Finance',
      icon: DollarSign,
      description: 'Track project budgets, expenses, and financial compliance',
      steps: [
        { title: 'Setting Project Budget', content: 'Define budget categories (materials, labor, equipment, permits) and allocate amounts. Set up alerts when spending reaches thresholds (75%, 90%, 100%).' },
        { title: 'Recording Expenses', content: 'Add expenses with vendor, date, amount, and category. Upload receipt photos for documentation. Track against budget categories.' },
        { title: 'Canadian Tax Compliance', content: 'CLMP tracks GST/HST automatically based on your province settings. Generate CRA-compliant expense reports for tax filing.' },
        { title: 'Financial Reports', content: 'Access Reports page for budget vs actual, expense breakdown, profit/loss, and cash flow reports. Export to PDF, Excel, or CSV.' }
      ]
    },
    {
      id: 'team',
      title: 'Team Collaboration',
      icon: Users,
      description: 'Manage team members, roles, and permissions',
      steps: [
        { title: 'User Roles', content: 'Admin: Full access. Project Manager: Manage assigned projects. Team Member: Update tasks, submit expenses. Viewer: Read-only access.' },
        { title: 'Chat & Messaging', content: 'Use the Chat feature for real-time communication. Create project-specific channels or send direct messages to team members.' },
        { title: 'Activity Feed', content: 'Track all project activity in the activity feed. See who made changes, when, and to what. Perfect for staying informed.' },
        { title: 'Notifications', content: 'Configure notification preferences in Settings. Choose email, in-app, or both for different types of updates.' }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance & Safety',
      icon: Shield,
      description: 'Manage permits, inspections, and safety compliance',
      steps: [
        { title: 'Permit Tracking', content: 'Add permits with type, number, issue/expiry dates, and issuing authority. Set reminders for renewals.' },
        { title: 'Inspection Management', content: 'Schedule inspections, record results, and track deficiencies. Upload inspection reports and photos.' },
        { title: 'OBC Compliance', content: 'Track Ontario Building Code requirements. Document compliance decisions and maintain audit trail.' },
        { title: 'Safety Documentation', content: 'Record safety meetings, incidents, and training. Maintain compliance documentation for audits.' }
      ]
    },
    {
      id: 'ai-risk',
      title: 'AI Risk Alerts',
      icon: AlertTriangle,
      description: 'AI-powered risk detection and weather monitoring',
      steps: [
        { title: 'How AI Risk Works', content: 'Our AI analyzes project data to identify potential risks: budget overruns, schedule delays, resource conflicts, and safety concerns.' },
        { title: 'Weather Monitoring', content: 'Get alerts about adverse weather conditions at your project location. Plan ahead to minimize weather-related delays.' },
        { title: 'Risk Categories', content: 'Risks are categorized as Low, Medium, High, or Critical. Focus on high-priority items first.' },
        { title: 'Mitigation Actions', content: 'Each risk comes with AI-generated recommendations. Track actions taken and monitor risk status over time.' }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Plug,
      description: 'Connect with QuickBooks, Sage 50, and other tools',
      steps: [
        { title: 'QuickBooks Integration', content: 'Connect your QuickBooks Online account to sync expenses, invoices, and financial data. Two-way sync keeps both systems current.' },
        { title: 'Sage 50 Integration', content: 'Export project financial data to Sage 50 format. Import vendor and customer data from Sage.' },
        { title: 'Calendar Sync', content: 'Sync CLMP events with Google Calendar or Microsoft Outlook. Keep all your schedules in one place.' },
        { title: 'File Storage', content: 'Connect cloud storage services (coming soon) for automatic file backup and sharing.' }
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      icon: CreditCard,
      description: 'Manage your subscription and payment methods',
      steps: [
        { title: 'Subscription Plans', content: 'Choose from Standard or Enterprise plans. Each tier unlocks additional features and team members.' },
        { title: 'Payment Methods', content: 'Add credit/debit cards for automatic billing. Enterprise customers can pay by invoice.' },
        { title: 'Billing History', content: 'View all past invoices and payment history in Settings > Billing. Download invoices for your records.' },
        { title: 'Upgrading/Downgrading', content: 'Change plans anytime. Upgrades take effect immediately. Downgrades apply at next billing cycle.' }
      ]
    }
  ];

  const filteredSections = manualSections.filter(section =>
    searchQuery === '' ||
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.steps.some(step => 
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search user manual..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Introduction */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Welcome to CLMP User Manual</h3>
              <p className="text-muted-foreground">
                This comprehensive guide will help you understand and use all features of the Construction & Labor Management Platform.
                Select any topic below to view step-by-step instructions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {section.steps.map((step, index) => (
                  <AccordionItem key={index} value={`step-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                        <span>{step.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground pl-8">{step.content}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupportPage;
