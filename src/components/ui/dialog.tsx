"use client"

import * as React from "react"
import { X } from "lucide-react"

const Dialog = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (open: boolean) => void }
>(({ children, open: controlledOpen, onOpenChange, ...props }, ref) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = isControlled ? onOpenChange : setUncontrolledOpen

    // Provide context for children
    return (
        <DialogContext.Provider value={{ open: !!open, setOpen: setOpen || (() => { }) }}>
            <div {...props} ref={ref}>
                {children}
            </div>
        </DialogContext.Provider>
    )
})
Dialog.displayName = "Dialog"

const DialogContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => { } })

const DialogTrigger = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onClick, ...props }, ref) => {
    const { setOpen } = React.useContext(DialogContext)
    return (
        <div
            ref={ref}
            className={className}
            onClick={(e) => {
                setOpen(true)
                onClick?.(e)
            }}
            {...props}
        >
            {children}
        </div>
    )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DialogContext)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => setOpen(false)}
            />

            {/* Content */}
            <div
                ref={ref}
                className={`relative z-50 grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg md:w-full ${className}`}
                {...props}
            >
                <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500">
                    <X className="h-4 w-4 cursor-pointer" onClick={() => setOpen(false)} />
                    <span className="sr-only">Close</span>
                </div>
                {children}
            </div>
        </div>
    )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={`text-lg font-semibold leading-none tracking-tight ${className}`}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={`text-sm text-slate-500 ${className}`}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
