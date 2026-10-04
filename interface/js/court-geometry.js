(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRACA_COURT_GEOMETRY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function courtData(source) {
    if (!source) throw new Error("COURT_PROFILE_REQUIRED");
    if (source.court) {
      return {
        width_m: source.court.width_m,
        half_length_m: source.court.half_length_m,
        goal: source.goal,
        markings: source.markings
      };
    }
    return source;
  }

  function goalPosts(source) {
    const court = courtData(source);
    const left = (court.width_m - court.goal.width_m) / 2;
    return { left, right: left + court.goal.width_m };
  }

  function protectedBoundaryY(source, x, distance) {
    const posts = goalPosts(source);
    if (x < posts.left - distance || x > posts.right + distance) return 0;
    if (x < posts.left) return Math.sqrt(Math.max(0, distance ** 2 - (x - posts.left) ** 2));
    if (x <= posts.right) return distance;
    return Math.sqrt(Math.max(0, distance ** 2 - (x - posts.right) ** 2));
  }

  function goalAreaBoundaryY(source, x) {
    const court = courtData(source);
    return protectedBoundaryY(court, x, court.markings.goal_area_radius_m);
  }

  function freeThrowBoundaryY(source, x) {
    const court = courtData(source);
    return protectedBoundaryY(court, x, court.markings.free_throw_distance_m);
  }

  function goalAreaClearance(source, point) {
    return point[1] - goalAreaBoundaryY(source, point[0]);
  }

  function isInsideGoalArea(source, point, tolerance) {
    return goalAreaClearance(source, point) < -(tolerance === undefined ? 0.001 : tolerance);
  }

  function minimumGroundCenterY(source, x, visualMargin) {
    const boundary = goalAreaBoundaryY(source, x);
    return boundary ? boundary + Math.max(0, visualMargin || 0) : 0;
  }

  function linePoint(segment, ratio) {
    return [
      segment.start[0] + (segment.end[0] - segment.start[0]) * ratio,
      segment.start[1] + (segment.end[1] - segment.start[1]) * ratio
    ];
  }

  function cubicPoint(segment, ratio) {
    const inverse = 1 - ratio;
    const coefficients = [inverse ** 3, 3 * inverse ** 2 * ratio, 3 * inverse * ratio ** 2, ratio ** 3];
    return [0, 1].map((axis) => coefficients[0] * segment.start[axis]
      + coefficients[1] * segment.control1[axis]
      + coefficients[2] * segment.control2[axis]
      + coefficients[3] * segment.end[axis]);
  }

  function pointDistance(left, right) {
    return Math.hypot(left[0] - right[0], left[1] - right[1]);
  }

  function segmentLengthEstimate(segment) {
    if (segment.type !== "cubic") return pointDistance(segment.start, segment.end);
    return pointDistance(segment.start, segment.control1)
      + pointDistance(segment.control1, segment.control2)
      + pointDistance(segment.control2, segment.end);
  }

  function samplePath(path, maximumStep) {
    const step = maximumStep || 0.08;
    const result = [];
    (path && path.segments || []).forEach((segment, segmentIndex) => {
      const count = Math.max(1, Math.ceil(segmentLengthEstimate(segment) / step));
      for (let index = 0; index <= count; index += 1) {
        if (segmentIndex && !index) continue;
        const ratio = index / count;
        result.push({
          point: segment.type === "cubic" ? cubicPoint(segment, ratio) : linePoint(segment, ratio),
          segment_index: segmentIndex,
          ratio
        });
      }
    });
    return result;
  }

  function validateGroundPath(path, source, options) {
    const configuration = options || {};
    const requiredClearance = configuration.minimum_clearance_m || 0;
    const samples = samplePath(path, configuration.maximum_step_m || 0.06);
    let minimum = Infinity;
    let nearest = null;
    samples.forEach((sample) => {
      const clearance = goalAreaClearance(source, sample.point);
      if (clearance < minimum) { minimum = clearance; nearest = sample; }
    });
    return {
      valid: Boolean(samples.length) && minimum >= requiredClearance - (configuration.tolerance_m || 0.01),
      minimum_clearance_m: Number((Number.isFinite(minimum) ? minimum : 0).toFixed(3)),
      required_clearance_m: requiredClearance,
      nearest_point: nearest ? nearest.point.map((value) => Number(value.toFixed(3))) : null,
      segment_index: nearest ? nearest.segment_index : null
    };
  }

  function pointToLineDistance(point, start, end) {
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const denominator = dx * dx + dy * dy;
    if (!denominator) return pointDistance(point, start);
    const ratio = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
    return pointDistance(point, [start[0] + ratio * dx, start[1] + ratio * dy]);
  }

  function minimumDistanceToPath(point, path) {
    let minimum = Infinity;
    (path && path.segments || []).forEach((segment) => {
      if (segment.type === "line") minimum = Math.min(minimum, pointToLineDistance(point, segment.start, segment.end));
      else samplePath({ segments: [segment] }, 0.04).forEach((sample) => { minimum = Math.min(minimum, pointDistance(point, sample.point)); });
    });
    return Number((Number.isFinite(minimum) ? minimum : 0).toFixed(3));
  }

  function turnAngleDegrees(before, vertex, after) {
    const incoming = [vertex[0] - before[0], vertex[1] - before[1]];
    const outgoing = [after[0] - vertex[0], after[1] - vertex[1]];
    const lengths = Math.hypot(...incoming) * Math.hypot(...outgoing);
    if (!lengths) return 0;
    const cosine = Math.max(-1, Math.min(1, (incoming[0] * outgoing[0] + incoming[1] * outgoing[1]) / lengths));
    return Number((Math.acos(cosine) * 180 / Math.PI).toFixed(2));
  }

  function goalAreaPath(source) {
    const court = courtData(source);
    const posts = goalPosts(court);
    const radius = court.markings.goal_area_radius_m;
    return `M ${posts.left - radius} 0 A ${radius} ${radius} 0 0 0 ${posts.left} ${radius} L ${posts.right} ${radius} A ${radius} ${radius} 0 0 0 ${posts.right + radius} 0`;
  }

  function freeThrowPath(source) {
    const court = courtData(source);
    const posts = goalPosts(court);
    const radius = court.markings.free_throw_distance_m;
    return `M ${posts.left - radius} 0 A ${radius} ${radius} 0 0 0 ${posts.left} ${radius} L ${posts.right} ${radius} A ${radius} ${radius} 0 0 0 ${posts.right + radius} 0`;
  }

  function usefulViewBox(source, points) {
    const court = courtData(source);
    const maximumY = (points || []).reduce((value, point) => Math.max(value, point && point[1] || 0), 0);
    const bottom = Math.min(court.half_length_m + 0.8, Math.max(11.4, maximumY + 1.25));
    return [-0.8, -1, court.width_m + 1.6, Number((bottom + 1).toFixed(3))];
  }

  return {
    courtData,
    goalPosts,
    protectedBoundaryY,
    goalAreaBoundaryY,
    freeThrowBoundaryY,
    goalAreaClearance,
    isInsideGoalArea,
    minimumGroundCenterY,
    samplePath,
    validateGroundPath,
    minimumDistanceToPath,
    turnAngleDegrees,
    goalAreaPath,
    freeThrowPath,
    usefulViewBox
  };
});
