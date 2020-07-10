import Objection from "objection";
import { CasbinFilter, CasbinRule, CasbinRuleFilter } from "./model";

type ConditionObject = Record<string, string[]>;
type FilterObject = Record<string, ConditionObject>;
type ObjectionQueryModifier = "where" | "orWhere";

function interpretConditions(conditionList: CasbinRuleFilter): ConditionObject {
  const conditionObj: ConditionObject = {};
  conditionList.forEach((cond, i) => {
    if (cond === null || typeof cond === "undefined" || cond === "") return;
    if (cond.startsWith("regex:")) {
      conditionObj[`v${i}`] = ["~", cond.replace("regex:", "")];
    } else if (cond.startsWith("like:")) {
      conditionObj[`v${i}`] = ["ilike", cond.replace("like:", "")];
    } else {
      conditionObj[`v${i}`] = ["=", cond];
    }
  });
  return conditionObj;
}

export function interpretFilter(filter: CasbinFilter): FilterObject {
  const interpreted = Object.keys(filter).reduce(
    (interpretedFilter: FilterObject, ptype) => {
      interpretedFilter[ptype] = interpretConditions(filter[ptype]);
      return interpretedFilter;
    },
    {},
  );
  return interpreted;
}

function addQueryConditions(
  conditions: ConditionObject,
  query: Objection.QueryBuilder<CasbinRule, CasbinRule[]>,
): Objection.QueryBuilder<CasbinRule, CasbinRule[]> {
  let _query = query;
  Object.keys(conditions).forEach((cond) => {
    const [op, val] = conditions[cond];
    _query = _query.where(cond, op, val);
  });
  return _query;
}

function _createQuery(
  filterObj: FilterObject,
): (model: typeof CasbinRule) => Promise<CasbinRule[]> {
  return (model) => {
    let casbinQuery = model.query();
    let queryModifier: ObjectionQueryModifier = "where";
    Object.keys(filterObj).forEach((ptype, i) => {
      if (i > 0) queryModifier = "orWhere";
      casbinQuery = casbinQuery[queryModifier](function () {
        addQueryConditions(filterObj[ptype], this.where("ptype", "=", ptype));
      });
    });
    return casbinQuery;
  };
}

const createFilterQuery = (
  filterObj: FilterObject,
  model: typeof CasbinRule,
): Promise<CasbinRule[]> => _createQuery(filterObj)(model);

export function useFilterQuery(
  queryObject: FilterObject,
  model: typeof CasbinRule,
): Promise<CasbinRule[]> {
  return createFilterQuery(queryObject, model);
}

export function getFilteredPolicies(
  filter: CasbinFilter,
  model: typeof CasbinRule,
): Promise<CasbinRule[]> {
  const policyFilter = interpretFilter(filter);
  return useFilterQuery(policyFilter, model);
}
