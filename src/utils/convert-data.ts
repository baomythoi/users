export default new class ConvertData {
  snakeToCamel(obj: any): any {
    const camelCaseData: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, match) => match.toUpperCase());
        camelCaseData[camelKey] = obj[key];
      }
    }

    return camelCaseData;
  }
}