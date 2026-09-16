import {
  BusinessProfile,
  Learner,
  AuditChecklistItem,
  Course,
  AuditSnapshot,
  ChecklistAttachment,
  PortfolioClientMetric,
  RegulatoryChangelogEntry,
  UserSession,
} from '../types';

export const api = {
  async fetchUsers(): Promise<UserSession[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async fetchBusinesses(): Promise<BusinessProfile[]> {
    const res = await fetch('/api/businesses');
    if (!res.ok) throw new Error('Failed to fetch businesses');
    return res.json();
  },

  async fetchBusiness(id: string): Promise<BusinessProfile> {
    const res = await fetch(`/api/business/${id}`);
    if (!res.ok) throw new Error('Failed to fetch business');
    return res.json();
  },

  async updateBusiness(id: string, data: Partial<BusinessProfile>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/business/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update business');
    return res.json();
  },

  async createBusiness(data: Partial<BusinessProfile>): Promise<{ id: string; success: boolean }> {
    const res = await fetch('/api/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create business');
    return res.json();
  },

  async fetchLearners(businessId: string, includeArchived = true): Promise<Learner[]> {
    const res = await fetch(`/api/business/${businessId}/learners?includeArchived=${includeArchived}`);
    if (!res.ok) throw new Error('Failed to fetch learners');
    return res.json();
  },

  async createLearner(businessId: string, data: Partial<Learner>): Promise<{ id: string; success: boolean }> {
    const res = await fetch(`/api/business/${businessId}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create learner');
    return res.json();
  },

  async updateLearner(businessId: string, learnerId: string, data: Partial<Learner>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/business/${businessId}/learners/${learnerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update learner');
    return res.json();
  },

  async archiveLearner(businessId: string, learnerId: string, reason: string): Promise<{ success: boolean; archivedAt: string }> {
    const res = await fetch(`/api/business/${businessId}/learners/${learnerId}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to archive learner');
    return res.json();
  },

  async restoreLearner(businessId: string, learnerId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/business/${businessId}/learners/${learnerId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Failed to restore learner');
    return res.json();
  },

  async enrolCourse(
    businessId: string,
    learnerId: string,
    courseData: {
      courseId: string;
      courseTitle: string;
      status: string;
      progressPercent?: number;
      completedDate?: string;
      expiryDate?: string;
      score?: number;
    }
  ): Promise<{ success: boolean }> {
    const res = await fetch(`/api/business/${businessId}/learners/${learnerId}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData),
    });
    if (!res.ok) throw new Error('Failed to record course');
    return res.json();
  },

  async bulkImportLearners(
    businessId: string,
    rows: Array<{
      name: string;
      email: string;
      roleLevel: string;
      jobTitle?: string;
      department?: string;
      startDate?: string;
      rightToWorkStatus?: string;
      completedCourses?: string;
    }>
  ): Promise<{ success: boolean; importedCount: number }> {
    const res = await fetch(`/api/business/${businessId}/learners/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) throw new Error('Failed to bulk import learners');
    return res.json();
  },

  async fetchChecklists(businessId: string): Promise<AuditChecklistItem[]> {
    const res = await fetch(`/api/business/${businessId}/checklists`);
    if (!res.ok) throw new Error('Failed to fetch checklists');
    return res.json();
  },

  async updateChecklist(
    businessId: string,
    checklistId: string,
    data: Partial<AuditChecklistItem>
  ): Promise<{ success: boolean; lastReviewedDate: string }> {
    const res = await fetch(`/api/business/${businessId}/checklists/${checklistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update checklist item');
    return res.json();
  },

  async addAttachment(
    businessId: string,
    checklistId: string,
    attachment: Partial<ChecklistAttachment>
  ): Promise<{ success: boolean; attachment: ChecklistAttachment }> {
    const res = await fetch(`/api/business/${businessId}/checklists/${checklistId}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attachment),
    });
    if (!res.ok) throw new Error('Failed to add attachment');
    return res.json();
  },

  async removeAttachment(
    businessId: string,
    checklistId: string,
    attachmentId: string
  ): Promise<{ success: boolean }> {
    const res = await fetch(`/api/business/${businessId}/checklists/${checklistId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove attachment');
    return res.json();
  },

  async fetchCourses(): Promise<Course[]> {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  },

  async updateCourse(courseId: string, data: Partial<Course>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update course');
    return res.json();
  },

  async fetchSnapshots(businessId: string): Promise<AuditSnapshot[]> {
    const res = await fetch(`/api/business/${businessId}/snapshots`);
    if (!res.ok) throw new Error('Failed to fetch snapshots');
    return res.json();
  },

  async createSnapshot(businessId: string, data: Partial<AuditSnapshot>): Promise<{ success: boolean; id: string; timestamp: string }> {
    const res = await fetch(`/api/business/${businessId}/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create snapshot');
    return res.json();
  },

  async fetchPortfolioMetrics(): Promise<PortfolioClientMetric[]> {
    const res = await fetch('/api/admin/portfolio');
    if (!res.ok) throw new Error('Failed to fetch portfolio metrics');
    return res.json();
  },

  async fetchChangelog(): Promise<RegulatoryChangelogEntry[]> {
    const res = await fetch('/api/admin/changelog');
    if (!res.ok) throw new Error('Failed to fetch changelog');
    return res.json();
  },

  async sendReminders(businessId: string): Promise<{ success: boolean; dispatchedCount: number; notifications: any[] }> {
    const res = await fetch(`/api/business/${businessId}/reminders/send`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to dispatch reminders');
    return res.json();
  },

  async resetDemoDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/reset-demo', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset demo');
    return res.json();
  },
};
