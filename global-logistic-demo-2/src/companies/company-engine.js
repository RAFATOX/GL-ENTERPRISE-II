export class CompanyEngine {
  constructor(state) {
    this.state = state;
  }

  getById(companyId) {
    return this.state.companies.find((company) => company.id === companyId) || null;
  }

  byType(type) {
    return this.state.companies.filter((company) => company.type === type);
  }

  userBelongsToCompany(userId, companyId) {
    const company = this.getById(companyId);
    return Boolean(company?.people.includes(userId));
  }

  trustScore(companyId) {
    return this.getById(companyId)?.trustScore ?? 0;
  }
}
