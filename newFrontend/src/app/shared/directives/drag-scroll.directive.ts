import { Directive, ElementRef, HostListener, Renderer2, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appDragScroll]',
  standalone: true
})
export class DragScrollDirective implements OnInit, OnDestroy {
  private isMouseDown = false;
  private startX = 0;
  private scrollLeft = 0;
  private isDragging = false;
  private clickCaptureListener?: (e: MouseEvent) => void;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    const element = this.el.nativeElement as HTMLElement;
    this.renderer.setStyle(element, 'cursor', 'grab');
    this.renderer.setStyle(element, 'user-select', 'none');

    // Attach click capture listener to prevent clicks on child cards when dragging
    this.clickCaptureListener = (e: MouseEvent) => {
      if (this.isDragging) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        this.isDragging = false;
      }
    };

    element.addEventListener('click', this.clickCaptureListener, true);
  }

  ngOnDestroy() {
    if (this.clickCaptureListener) {
      this.el.nativeElement.removeEventListener('click', this.clickCaptureListener, true);
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    this.isMouseDown = true;
    this.isDragging = false;
    const element = this.el.nativeElement as HTMLElement;
    this.renderer.setStyle(element, 'cursor', 'grabbing');
    this.startX = e.pageX - element.offsetLeft;
    this.scrollLeft = element.scrollLeft;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isMouseDown = false;
    const element = this.el.nativeElement as HTMLElement;
    this.renderer.setStyle(element, 'cursor', 'grab');
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.isMouseDown = false;
    const element = this.el.nativeElement as HTMLElement;
    this.renderer.setStyle(element, 'cursor', 'grab');
    setTimeout(() => {
      this.isDragging = false;
    }, 50);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isMouseDown) return;
    const element = this.el.nativeElement as HTMLElement;
    const x = e.pageX - element.offsetLeft;
    const walk = (x - this.startX) * 1.3;

    if (Math.abs(walk) > 5) {
      this.isDragging = true;
    }

    e.preventDefault();
    element.scrollLeft = this.scrollLeft - walk;
  }
}
