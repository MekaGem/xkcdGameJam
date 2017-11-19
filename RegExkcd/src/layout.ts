const DEFAULT_SPACING = 10;

export enum LayoutDirection {
    Vertical, Horizontal
};

export class TiledLayout extends createjs.Container {
    direction: LayoutDirection;
    spacing: number;
    center_elements: boolean;
    size: number;

    constructor(direction: LayoutDirection, spacing: number, center_elements: boolean = false, size: number = 0) {
        super();

        this.direction = direction;
        this.spacing = spacing;
        this.center_elements = center_elements;
        this.size = size;
    }

    apply_centering() {
        let offset;
        if (this.direction === LayoutDirection.Horizontal) {
            offset = (this.size - super.getBounds().width) / 2;
        } else {
            offset = (this.size - super.getBounds().height) / 2;
        }

        console.log(`size = ${this.size}, offset = ${offset}`)

        for (let child of this.children) {
            if (this.direction === LayoutDirection.Horizontal) {
                child.x += offset;
            } else {
                child.y += offset;
            }
        }
    }

    addItem(item: createjs.DisplayObject, spacing: number = 0) {
        if (this.numChildren > 0) {
            if (this.direction === LayoutDirection.Horizontal) {
                item.x += super.getBounds().width + this.spacing + spacing;
            } else {
                item.y += super.getBounds().height + this.spacing + spacing;
            }
        }
        super.addChild(item);
    }
};