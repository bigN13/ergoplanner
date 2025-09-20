import { XYPosition, Position } from 'reactflow';
import {
  RoutingResult,
  Waypoint,
  Obstacle,
  PathSegment,
  RoutingConfig,
  EdgeCrossing,
  Conflict,
  RoutingContext,
} from '@/types/routing';

/**
 * Orthogonal (Manhattan) routing algorithm with collision detection
 * Provides intelligent pipe routing following engineering standards
 */
export class OrthogonalRouter {
  private config: RoutingConfig;
  private obstacles: Obstacle[];
  private existingEdges: any[];
  private gridSize: number;

  constructor(config: RoutingConfig) {
    this.config = config;
    this.obstacles = [];
    this.existingEdges = [];
    this.gridSize = 20; // Default grid size
  }

  /**
   * Calculate optimal orthogonal path between two points
   */
  public calculatePath(
    source: XYPosition,
    target: XYPosition,
    sourcePosition: Position,
    targetPosition: Position,
    context: RoutingContext
  ): RoutingResult {
    // Initialize routing context
    this.updateContext(context);

    // Align points to grid if enabled
    const alignedSource = this.config.gridAlignment ? this.alignToGrid(source) : source;
    const alignedTarget = this.config.gridAlignment ? this.alignToGrid(target) : target;

    // Calculate initial path
    let path = this.calculateInitialPath(alignedSource, alignedTarget, sourcePosition, targetPosition);

    // Apply collision detection and avoidance
    if (this.config.avoidObstacles) {
      path = this.avoidObstacles(path);
    }

    // Optimize path if enabled
    if (this.config.optimization.minimizeLength || this.config.optimization.minimizeBends) {
      path = this.optimizePath(path);
    }

    // Generate waypoints
    const waypoints = this.generateWaypoints(path);

    // Detect crossings
    const crossings = this.detectCrossings(path);

    // Calculate conflicts
    const conflicts = this.detectConflicts(path, waypoints, crossings);

    // Calculate metrics
    const totalLength = this.calculatePathLength(path);
    const bendCount = this.calculateBendCount(path);
    const cost = this.calculateRoutingCost(path, bendCount, crossings.length);

    return {
      path,
      waypoints,
      crossings,
      totalLength,
      bendCount,
      conflicts,
      cost,
      isOptimal: conflicts.length === 0 && bendCount <= this.config.maxBends,
    };
  }

  /**
   * Calculate initial orthogonal path using A* algorithm variant
   */
  private calculateInitialPath(
    source: XYPosition,
    target: XYPosition,
    sourcePosition: Position,
    targetPosition: Position
  ): XYPosition[] {
    const path: XYPosition[] = [source];

    // Calculate connection points based on handle positions
    const sourceConnection = this.getConnectionPoint(source, sourcePosition);
    const targetConnection = this.getConnectionPoint(target, targetPosition);

    // Add intermediate points for orthogonal routing
    const intermediatePoints = this.calculateIntermediatePoints(
      sourceConnection,
      targetConnection,
      sourcePosition,
      targetPosition
    );

    path.push(...intermediatePoints);
    path.push(target);

    return this.simplifyPath(path);
  }

  /**
   * Get connection point offset from node position based on handle position
   */
  private getConnectionPoint(nodePosition: XYPosition, handlePosition: Position): XYPosition {
    const offset = this.config.spacing.node;

    switch (handlePosition) {
      case Position.Top:
        return { x: nodePosition.x, y: nodePosition.y - offset };
      case Position.Bottom:
        return { x: nodePosition.x, y: nodePosition.y + offset };
      case Position.Left:
        return { x: nodePosition.x - offset, y: nodePosition.y };
      case Position.Right:
        return { x: nodePosition.x + offset, y: nodePosition.y };
      default:
        return nodePosition;
    }
  }

  /**
   * Calculate intermediate points for orthogonal routing
   */
  private calculateIntermediatePoints(
    source: XYPosition,
    target: XYPosition,
    sourcePosition: Position,
    targetPosition: Position
  ): XYPosition[] {
    const points: XYPosition[] = [];
    const dx = target.x - source.x;
    const dy = target.y - source.y;

    // Determine routing strategy based on handle positions
    if (this.isDirectConnection(sourcePosition, targetPosition, dx, dy)) {
      // Direct connection possible
      return points;
    }

    // Calculate bend points based on preferred direction
    const preferHorizontalFirst = this.shouldPreferHorizontalFirst(sourcePosition, targetPosition);

    if (preferHorizontalFirst) {
      // Horizontal first, then vertical
      const bendX = this.calculateOptimalBendX(source, target, sourcePosition, targetPosition);
      points.push({ x: bendX, y: source.y });
      if (Math.abs(target.y - source.y) > this.config.minSegmentLength) {
        points.push({ x: bendX, y: target.y });
      }
    } else {
      // Vertical first, then horizontal
      const bendY = this.calculateOptimalBendY(source, target, sourcePosition, targetPosition);
      points.push({ x: source.x, y: bendY });
      if (Math.abs(target.x - source.x) > this.config.minSegmentLength) {
        points.push({ x: target.x, y: bendY });
      }
    }

    return points;
  }

  /**
   * Check if direct connection is possible and optimal
   */
  private isDirectConnection(
    sourcePosition: Position,
    targetPosition: Position,
    dx: number,
    dy: number
  ): boolean {
    // Check if handles are aligned for direct connection
    if (
      (sourcePosition === Position.Right && targetPosition === Position.Left && dx > 0) ||
      (sourcePosition === Position.Left && targetPosition === Position.Right && dx < 0) ||
      (sourcePosition === Position.Bottom && targetPosition === Position.Top && dy > 0) ||
      (sourcePosition === Position.Top && targetPosition === Position.Bottom && dy < 0)
    ) {
      return Math.abs(dx) < this.config.minSegmentLength || Math.abs(dy) < this.config.minSegmentLength;
    }
    return false;
  }

  /**
   * Determine if horizontal-first routing is preferred
   */
  private shouldPreferHorizontalFirst(sourcePosition: Position, targetPosition: Position): boolean {
    if (this.config.preferredDirection === 'horizontal') return true;
    if (this.config.preferredDirection === 'vertical') return false;

    // Default logic based on handle positions
    return (
      sourcePosition === Position.Left ||
      sourcePosition === Position.Right ||
      targetPosition === Position.Left ||
      targetPosition === Position.Right
    );
  }

  /**
   * Calculate optimal bend X coordinate
   */
  private calculateOptimalBendX(
    source: XYPosition,
    target: XYPosition,
    sourcePosition: Position,
    targetPosition: Position
  ): number {
    const midpoint = source.x + (target.x - source.x) / 2;

    // Adjust based on handle positions and obstacles
    if (sourcePosition === Position.Right) {
      return Math.max(source.x + this.config.spacing.node, midpoint);
    } else if (sourcePosition === Position.Left) {
      return Math.min(source.x - this.config.spacing.node, midpoint);
    }

    return this.alignToGrid({ x: midpoint, y: 0 }).x;
  }

  /**
   * Calculate optimal bend Y coordinate
   */
  private calculateOptimalBendY(
    source: XYPosition,
    target: XYPosition,
    sourcePosition: Position,
    targetPosition: Position
  ): number {
    const midpoint = source.y + (target.y - source.y) / 2;

    // Adjust based on handle positions and obstacles
    if (sourcePosition === Position.Bottom) {
      return Math.max(source.y + this.config.spacing.node, midpoint);
    } else if (sourcePosition === Position.Top) {
      return Math.min(source.y - this.config.spacing.node, midpoint);
    }

    return this.alignToGrid({ x: 0, y: midpoint }).y;
  }

  /**
   * Avoid obstacles by rerouting path segments
   */
  private avoidObstacles(path: XYPosition[]): XYPosition[] {
    const newPath: XYPosition[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const segment = { start: path[i], end: path[i + 1] };
      const obstacles = this.getSegmentObstacles(segment);

      if (obstacles.length === 0) {
        // No obstacles, keep original segment
        if (newPath.length === 0) newPath.push(segment.start);
        newPath.push(segment.end);
      } else {
        // Reroute around obstacles
        const reroutedPath = this.rerouteAroundObstacles(segment, obstacles);
        if (newPath.length === 0) newPath.push(reroutedPath[0]);
        newPath.push(...reroutedPath.slice(1));
      }
    }

    return newPath;
  }

  /**
   * Reroute path segment around obstacles
   */
  private rerouteAroundObstacles(segment: PathSegment, obstacles: Obstacle[]): XYPosition[] {
    // Simple obstacle avoidance - can be enhanced with more sophisticated algorithms
    const { start, end } = segment;
    const path: XYPosition[] = [start];

    // Find the largest obstacle to route around
    const mainObstacle = obstacles.reduce((largest, current) => {
      const currentArea = current.bounds.width * current.bounds.height;
      const largestArea = largest.bounds.width * largest.bounds.height;
      return currentArea > largestArea ? current : largest;
    });

    // Determine which side to route around
    const obstacleCenter = {
      x: mainObstacle.bounds.x + mainObstacle.bounds.width / 2,
      y: mainObstacle.bounds.y + mainObstacle.bounds.height / 2,
    };

    const pathCenter = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };

    // Calculate avoidance points
    const margin = this.config.spacing.crossing;
    const bounds = mainObstacle.bounds;

    if (Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) {
      // Horizontal segment - route above or below
      const routeAbove = pathCenter.y < obstacleCenter.y;
      const avoidY = routeAbove ? bounds.y - margin : bounds.y + bounds.height + margin;

      path.push({ x: bounds.x - margin, y: start.y });
      path.push({ x: bounds.x - margin, y: avoidY });
      path.push({ x: bounds.x + bounds.width + margin, y: avoidY });
      path.push({ x: bounds.x + bounds.width + margin, y: end.y });
    } else {
      // Vertical segment - route left or right
      const routeLeft = pathCenter.x < obstacleCenter.x;
      const avoidX = routeLeft ? bounds.x - margin : bounds.x + bounds.width + margin;

      path.push({ x: start.x, y: bounds.y - margin });
      path.push({ x: avoidX, y: bounds.y - margin });
      path.push({ x: avoidX, y: bounds.y + bounds.height + margin });
      path.push({ x: end.x, y: bounds.y + bounds.height + margin });
    }

    path.push(end);
    return path;
  }

  /**
   * Optimize path by removing unnecessary points and minimizing bends
   */
  private optimizePath(path: XYPosition[]): XYPosition[] {
    if (path.length <= 2) return path;

    let optimized = [...path];

    // Remove collinear points
    optimized = this.removeCollinearPoints(optimized);

    // Minimize bends if enabled
    if (this.config.optimization.minimizeBends) {
      optimized = this.minimizeBends(optimized);
    }

    // Minimize length if enabled
    if (this.config.optimization.minimizeLength) {
      optimized = this.minimizeLength(optimized);
    }

    return optimized;
  }

  /**
   * Remove points that are collinear (on same straight line)
   */
  private removeCollinearPoints(path: XYPosition[]): XYPosition[] {
    if (path.length <= 2) return path;

    const optimized: XYPosition[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];

      // Check if points are collinear
      if (!this.areCollinear(prev, current, next)) {
        optimized.push(current);
      }
    }

    optimized.push(path[path.length - 1]);
    return optimized;
  }

  /**
   * Check if three points are collinear
   */
  private areCollinear(p1: XYPosition, p2: XYPosition, p3: XYPosition): boolean {
    const threshold = 0.1; // Small tolerance for floating point comparison

    // Calculate cross product
    const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

    return Math.abs(crossProduct) < threshold;
  }

  /**
   * Minimize number of bends in path
   */
  private minimizeBends(path: XYPosition[]): XYPosition[] {
    // Implementation would involve more complex optimization
    // For now, return path as-is
    return path;
  }

  /**
   * Minimize total path length
   */
  private minimizeLength(path: XYPosition[]): XYPosition[] {
    // Implementation would involve more complex optimization
    // For now, return path as-is
    return path;
  }

  /**
   * Simplify path by removing redundant points
   */
  private simplifyPath(path: XYPosition[]): XYPosition[] {
    if (path.length <= 2) return path;

    const simplified: XYPosition[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const current = path[i];
      const next = path[i + 1];

      // Keep point if it creates a necessary bend
      if (!this.areCollinear(prev, current, next)) {
        simplified.push(current);
      }
    }

    simplified.push(path[path.length - 1]);
    return simplified;
  }

  /**
   * Generate waypoints from path
   */
  private generateWaypoints(path: XYPosition[]): Waypoint[] {
    return path.slice(1, -1).map((point, index) => ({
      id: `waypoint_${index}`,
      position: point,
      type: 'auto' as const,
      locked: false,
    }));
  }

  /**
   * Detect crossings with other edges
   */
  private detectCrossings(path: XYPosition[]): EdgeCrossing[] {
    const crossings: EdgeCrossing[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const segment = { start: path[i], end: path[i + 1] };

      for (const edge of this.existingEdges) {
        if (!edge.data?.path) continue;

        for (let j = 0; j < edge.data.path.length - 1; j++) {
          const otherSegment = { start: edge.data.path[j], end: edge.data.path[j + 1] };
          const intersection = this.getLineIntersection(segment, otherSegment);

          if (intersection) {
            crossings.push({
              id: `crossing_${crossings.length}`,
              position: intersection,
              crossingEdgeId: edge.id,
              type: 'over',
              symbol: 'bridge',
              clearance: this.config.spacing.crossing,
            });
          }
        }
      }
    }

    return crossings;
  }

  /**
   * Calculate intersection point of two line segments
   */
  private getLineIntersection(
    line1: { start: XYPosition; end: XYPosition },
    line2: { start: XYPosition; end: XYPosition }
  ): XYPosition | null {
    const { start: p1, end: p2 } = line1;
    const { start: p3, end: p4 } = line2;

    const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);

    if (Math.abs(denominator) < 1e-10) {
      return null; // Lines are parallel
    }

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y),
      };
    }

    return null; // No intersection within segments
  }

  /**
   * Detect conflicts in the routing
   */
  private detectConflicts(
    path: XYPosition[],
    waypoints: Waypoint[],
    crossings: EdgeCrossing[]
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check for excessive crossings
    if (crossings.length > 5) {
      conflicts.push({
        id: `conflict_crossings`,
        type: 'crossing',
        severity: 'warning',
        position: path[Math.floor(path.length / 2)],
        involvedIds: crossings.map(c => c.crossingEdgeId),
        description: `Too many crossings detected (${crossings.length})`,
        suggestions: ['Consider alternative routing', 'Use different layers'],
      });
    }

    // Check for excessive bends
    const bendCount = this.calculateBendCount(path);
    if (bendCount > this.config.maxBends) {
      conflicts.push({
        id: `conflict_bends`,
        type: 'constraint',
        severity: 'warning',
        position: path[Math.floor(path.length / 2)],
        involvedIds: [],
        description: `Too many bends (${bendCount} > ${this.config.maxBends})`,
        suggestions: ['Simplify routing', 'Adjust node positions'],
      });
    }

    return conflicts;
  }

  /**
   * Update routing context with current state
   */
  private updateContext(context: RoutingContext): void {
    this.obstacles = this.generateObstacles(context.nodes);
    this.existingEdges = context.edges;
  }

  /**
   * Generate obstacles from nodes
   */
  private generateObstacles(nodes: any[]): Obstacle[] {
    return nodes.map((node, index) => ({
      id: node.id || `node_${index}`,
      bounds: {
        x: node.position.x - (node.width || 100) / 2,
        y: node.position.y - (node.height || 50) / 2,
        width: node.width || 100,
        height: node.height || 50,
      },
      type: 'node' as const,
      priority: 1,
      avoidance: 'hard' as const,
    }));
  }

  /**
   * Get obstacles that intersect with a path segment
   */
  private getSegmentObstacles(segment: PathSegment): Obstacle[] {
    return this.obstacles.filter(obstacle =>
      this.segmentIntersectsRectangle(segment, obstacle.bounds)
    );
  }

  /**
   * Check if line segment intersects with rectangle
   */
  private segmentIntersectsRectangle(
    segment: PathSegment,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    const { start, end } = segment;
    const { x, y, width, height } = rect;

    // Check if segment endpoints are inside rectangle
    if (this.pointInRectangle(start, rect) || this.pointInRectangle(end, rect)) {
      return true;
    }

    // Check if segment intersects rectangle edges
    const rectLines = [
      { start: { x, y }, end: { x: x + width, y } },
      { start: { x: x + width, y }, end: { x: x + width, y: y + height } },
      { start: { x: x + width, y: y + height }, end: { x, y: y + height } },
      { start: { x, y: y + height }, end: { x, y } },
    ];

    return rectLines.some(line => this.getLineIntersection(segment, line) !== null);
  }

  /**
   * Check if point is inside rectangle
   */
  private pointInRectangle(
    point: XYPosition,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  /**
   * Align position to grid
   */
  private alignToGrid(position: XYPosition): XYPosition {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize,
    };
  }

  /**
   * Calculate total path length
   */
  private calculatePathLength(path: XYPosition[]): number {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  /**
   * Calculate number of bends in path
   */
  private calculateBendCount(path: XYPosition[]): number {
    if (path.length <= 2) return 0;

    let bends = 0;
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];

      if (!this.areCollinear(prev, current, next)) {
        bends++;
      }
    }

    return bends;
  }

  /**
   * Calculate routing cost based on various factors
   */
  private calculateRoutingCost(path: XYPosition[], bendCount: number, crossingCount: number): number {
    const length = this.calculatePathLength(path);
    const lengthCost = length * 0.1;
    const bendCost = bendCount * 10;
    const crossingCost = crossingCount * 20;

    return lengthCost + bendCost + crossingCost;
  }
}

/**
 * Factory function to create orthogonal router with default config
 */
export function createOrthogonalRouter(config?: Partial<RoutingConfig>): OrthogonalRouter {
  const defaultConfig: RoutingConfig = {
    algorithm: 'orthogonal' as any,
    minSegmentLength: 20,
    maxBends: 8,
    bendRadius: 10,
    gridAlignment: true,
    avoidObstacles: true,
    spacing: {
      parallel: 30,
      crossing: 20,
      node: 40,
    },
    optimization: {
      minimizeLength: true,
      minimizeBends: true,
      avoidCrossings: true,
      maintainFlow: true,
    },
  };

  return new OrthogonalRouter({ ...defaultConfig, ...config });
}