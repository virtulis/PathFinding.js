var Node = require('./Node');

/**
 * The Grid class, which serves as the encapsulation of the layout of the nodes.
 * @constructor
 * @param {number} width Number of columns of the grid.
 * @param {number} height Number of rows of the grid.
 * @param {Array.<Array.<(number|boolean)>>} [matrix] - A 0-1 matrix
 *     representing the walkable status of the nodes(0 or false for walkable).
 *     If the matrix is not supplied, all the nodes will be walkable.  */
function Grid(width, height, matrix) {
    /**
     * The number of columns of the grid.
     * @type number
     */
    this.width = width;
    /**
     * The number of rows of the grid.
     * @type number
     */
    this.height = height;

    /**
     * A 2D array of nodes.
     */
    this.nodes = this._buildNodes(width, height, matrix);
    
    this.iteration = 0;
}

/**
 * Build and return the nodes.
 * @private
 * @param {number} width
 * @param {number} height
 * @param {Array.<Array.<number|boolean>>} [matrix] - A 0-1 matrix representing
 *     the walkable status of the nodes.
 * @see Grid
 */
Grid.prototype._buildNodes = function(width, height, matrix) {
    var i, j,
        nodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        nodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            nodes[i][j] = new Node(j, i);
        }
    }


    if (matrix === undefined) {
        return nodes;
    }

    if (matrix.length !== height || matrix[0].length !== width) {
        throw new Error('Matrix size does not fit');
    }

    for (i = 0; i < height; ++i) {
        for (j = 0; j < width; ++j) {
            if (matrix[i][j]) {
                // 0, false, null will be walkable
                // while others will be un-walkable
                nodes[i][j].walkable = false;
            }
        }
    }

    return nodes;
};


Grid.prototype.getNodeAt = function(x, y) {
	return this.nodes[y][x].get(this.iteration)
};


/**
 * Determine whether the node at the given position is walkable.
 * (Also returns false if the position is outside the grid.)
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @return {boolean} - The walkability of the node.
 */
Grid.prototype.isWalkableAt = function(x, y, border) {
	if (!this.isInside(x, y)) {
		return false;
	}
	var walkable = this.nodes[y][x].get(this.iteration).walkable;
	return (typeof walkable == 'string') ? walkable != border : walkable;
};


/**
 * Determine whether the position is inside the grid.
 * XXX: `grid.isInside(x, y)` is wierd to read.
 * It should be `(x, y) is inside grid`, but I failed to find a better
 * name for this method.
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
Grid.prototype.isInside = function(x, y) {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
};


/**
 * Set whether the node on the given position is walkable.
 * NOTE: throws exception if the coordinate is not inside the grid.
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @param {boolean} walkable - Whether the position is walkable.
 */
Grid.prototype.setWalkableAt = function(x, y, walkable) {
    this.nodes[y][x].walkable = walkable;
};


/**
 * Get the neighbors of the given node.
 *
 *     offsets      diagonalOffsets:
 *  +---+---+---+    +---+---+---+
 *  |   | 0 |   |    | 0 |   | 1 |
 *  +---+---+---+    +---+---+---+
 *  | 3 |   | 1 |    |   |   |   |
 *  +---+---+---+    +---+---+---+
 *  |   | 2 |   |    | 3 |   | 2 |
 *  +---+---+---+    +---+---+---+
 *
 *  When allowDiagonal is true, if offsets[i] is valid, then
 *  diagonalOffsets[i] and
 *  diagonalOffsets[(i + 1) % 4] is valid.
 * @param {Node} node
 * @param {boolean} allowDiagonal
 * @param {boolean} dontCrossCorners
 */
Grid.prototype.getNeighbors = function(node, allowDiagonal, dontCrossCorners) {
    var x = node.x,
        y = node.y,
        neighbors = [],
        s0 = false, d0 = false,
        s1 = false, d1 = false,
        s2 = false, d2 = false,
        s3 = false, d3 = false,
        nodes = this.nodes;

    // ↑
    if (this.isWalkableAt(x, y - 1, 'bottom') && this.isWalkableAt(x, y, 'top')) {
        neighbors.push(nodes[y - 1][x].get(this.iteration));
        s0 = true;
    }
    // →
    if (this.isWalkableAt(x + 1, y, 'left') && this.isWalkableAt(x, y, 'right')) {
        neighbors.push(nodes[y][x + 1].get(this.iteration));
        s1 = true;
    }
    // ↓
    if (this.isWalkableAt(x, y + 1, 'top') && this.isWalkableAt(x, y, 'bottom')) {
        neighbors.push(nodes[y + 1][x].get(this.iteration));
        s2 = true;
    }
    // ←
    if (this.isWalkableAt(x - 1, y, 'right') && this.isWalkableAt(x, y, 'left')) {
        neighbors.push(nodes[y][x - 1].get(this.iteration));
        s3 = true;
    }

    if (!allowDiagonal) {
        return neighbors;
    }

    if (dontCrossCorners) {
        d0 = s3 && s0;
        d1 = s0 && s1;
        d2 = s1 && s2;
        d3 = s2 && s3;
    } else {
        d0 = s3 || s0;
        d1 = s0 || s1;
        d2 = s1 || s2;
        d3 = s2 || s3;
    }

    // ↖
    if (d0 && this.isWalkableAt(x - 1, y - 1, 'bottom') && this.isWalkableAt(x - 1, y, 'top') && this.isWalkableAt(x - 1, y - 1, 'right') && this.isWalkableAt(x, y - 1, 'left')) {
        neighbors.push(nodes[y - 1][x - 1].get(this.iteration));
    }
    // ↗
    if (d1 && this.isWalkableAt(x + 1, y - 1, 'bottom') && this.isWalkableAt(x + 1, y, 'top') && this.isWalkableAt(x + 1, y - 1, 'left') && this.isWalkableAt(x, y - 1, 'right')) {
        neighbors.push(nodes[y - 1][x + 1].get(this.iteration));
    }
    // ↘
    if (d2 && this.isWalkableAt(x + 1, y + 1, 'top') && this.isWalkableAt(x + 1, y, 'bottom') && this.isWalkableAt(x + 1, y + 1, 'left') && this.isWalkableAt(x, y + 1, 'right')) {
        neighbors.push(nodes[y + 1][x + 1].get(this.iteration));
    }
    // ↙
    if (d3 && this.isWalkableAt(x - 1, y + 1, 'top') && this.isWalkableAt(x - 1, y, 'bottom') && this.isWalkableAt(x - 1, y + 1, 'right') && this.isWalkableAt(x, y + 1, 'left')) {
        neighbors.push(nodes[y + 1][x - 1].get(this.iteration));
    }

    return neighbors;
};


/**
 * Get a clone of this grid.
 * @return {Grid} Cloned grid.
 */
Grid.prototype.clone = function() {
    var i, j,

        width = this.width,
        height = this.height,
        thisNodes = this.nodes,

        newGrid = new Grid(width, height),
        newNodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        newNodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            newNodes[i][j] = new Node(j, i, thisNodes[i][j].walkable);
        }
    }

    newGrid.nodes = newNodes;

    return newGrid;
};

Grid.prototype.increment = function() {
	this.iteration++;
};

module.exports = Grid;
