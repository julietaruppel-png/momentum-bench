export type Candidate = {
  id: string
  created_at: string
  updated_at: string

  // Form fields
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  social_url: string | null
  location: string | null
  is_us_based: boolean
  time_zones: string[]
  revops_background: string | null
  crm_experience: string | null
  hubspot_areas: string[]
  desired_salary: string | null
  proud_project: string | null

  // Team-added fields
  resume_drive_url: string | null
  fathom_recording_url: string | null
  recap_summary: string | null
  english_level: 'Intermediate' | 'Advanced' | 'Fluent' | null
  availability: 'Available now' | '2 weeks notice' | 'Part-time only' | 'Not available' | null
  internal_notes: string | null
  date_screened: string | null

  // CRM skills
  skill_hubspot: boolean
  skill_salesforce: boolean
  skill_zoho: boolean
  skill_pipedrive: boolean
  skill_gohighlevel: boolean
  skill_other_crm: boolean

  // Automation
  skill_automation_tools: boolean
  skill_api_integrations: boolean
  skill_webhooks: boolean

  // Technical
  skill_sql: boolean
  skill_data_hygiene: boolean
  skill_crm_migrations: boolean
  skill_reporting_dashboards: boolean
  skill_ai_tools: boolean

  // Sales ops
  skill_setter_closer: boolean
  skill_sales_enablement: boolean
  skill_change_management: boolean
  skill_forecasting: boolean
  skill_kpi_reviews: boolean

  // Working style
  style_solo_operator: boolean
  style_team_environment: boolean
  style_client_facing: boolean
}

export type ClientToken = {
  id: string
  created_at: string
  client_name: string
  token: string
  active: boolean
  notes: string | null
}

export const FILTER_GROUPS = {
  crm: {
    label: 'CRM experience',
    filters: [
      { key: 'skill_hubspot', label: 'HubSpot' },
      { key: 'skill_salesforce', label: 'Salesforce' },
      { key: 'skill_zoho', label: 'Zoho' },
      { key: 'skill_pipedrive', label: 'Pipedrive' },
      { key: 'skill_gohighlevel', label: 'GoHighLevel' },
      { key: 'skill_other_crm', label: 'Other CRM' },
    ]
  },
  hubspot_areas: {
    label: 'HubSpot areas',
    filters: [
      { key: 'hubspot_workflow_automation', label: 'Workflow automation', isHubspotArea: true },
      { key: 'hubspot_sales_pipeline', label: 'Sales pipeline setup', isHubspotArea: true },
      { key: 'hubspot_conditional_logic', label: 'Conditional logic', isHubspotArea: true },
      { key: 'hubspot_custom_properties', label: 'Custom properties', isHubspotArea: true },
      { key: 'hubspot_lead_scoring', label: 'Lead scoring', isHubspotArea: true },
      { key: 'hubspot_reporting', label: 'Reporting & dashboards', isHubspotArea: true },
      { key: 'hubspot_email_sms', label: 'Email/SMS integration', isHubspotArea: true },
    ]
  },
  automation: {
    label: 'Automation & integrations',
    filters: [
      { key: 'skill_automation_tools', label: 'Automation tools (Zapier/Make/n8n)' },
      { key: 'skill_api_integrations', label: 'API integrations' },
      { key: 'skill_webhooks', label: 'Webhooks' },
    ]
  },
  technical: {
    label: 'Technical skills',
    filters: [
      { key: 'skill_sql', label: 'SQL' },
      { key: 'skill_data_hygiene', label: 'Data hygiene & deduplication' },
      { key: 'skill_crm_migrations', label: 'CRM migrations' },
      { key: 'skill_reporting_dashboards', label: 'Custom reporting & dashboards' },
      { key: 'skill_ai_tools', label: 'AI tools' },
    ]
  },
  salesops: {
    label: 'Sales operations',
    filters: [
      { key: 'skill_setter_closer', label: 'Setter/closer process' },
      { key: 'skill_sales_enablement', label: 'Sales team enablement' },
      { key: 'skill_change_management', label: 'Change management' },
      { key: 'skill_forecasting', label: 'Forecasting & pipeline visibility' },
      { key: 'skill_kpi_reviews', label: 'KPI reviews with leadership' },
    ]
  },
  style: {
    label: 'Working style',
    filters: [
      { key: 'style_solo_operator', label: 'Solo operator' },
      { key: 'style_team_environment', label: 'Team environment' },
      { key: 'style_client_facing', label: 'Client-facing / stakeholder comms' },
    ]
  }
}

export const HUBSPOT_AREA_LABELS: Record<string, string> = {
  'Workflow automation': 'Workflow automation',
  'Sales pipeline setup': 'Sales pipeline setup',
  'Conditional logic': 'Conditional logic',
  'Custom properties': 'Custom properties',
  'Lead scoring': 'Lead scoring',
  'Reporting & dashboards': 'Reporting & dashboards',
  'Email/SMS integration': 'Email/SMS integration',
}
