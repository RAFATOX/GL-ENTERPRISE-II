export class GlobalExpansionEngine {
  constructor(state) {
    this.state = state;
  }

  getRegion(region) {
    return this.state.regionRules.find((rule) => rule.region === region) || this.state.regionRules[0];
  }

  languageSupported(region, language) {
    return Boolean(this.getRegion(region)?.languages.includes(language));
  }

  currencyFor(region) {
    return this.getRegion(region)?.currency || "EUR";
  }
}
