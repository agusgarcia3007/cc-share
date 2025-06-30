"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CreditCard, Shield, Clock, Eye, HelpCircle } from "lucide-react";

const formSchema = z.object({
  cardholderName: z
    .string()
    .min(2, "El nombre del titular debe tener al menos 2 caracteres"),
  cardNumber: z
    .string()
    .min(19, "Número de tarjeta debe tener 16 dígitos")
    .max(19, "Número de tarjeta debe tener 16 dígitos"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Formato debe ser MM/YY"),
  cvv: z
    .string()
    .min(3, "CVV debe tener al menos 3 dígitos")
    .max(4, "CVV no puede tener más de 4 dígitos"),
  reads: z.string(),
  ttl: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreditCardShare() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      reads: "1",
      ttl: "1",
    },
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + "/" + cleanValue.substring(2, 4);
    }
    return cleanValue;
  };

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Encrypt and Share
          </h1>
          <p className="text-muted-foreground text-lg">
            Securely share credit card details with end-to-end encryption
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="bg-card border-border">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CreditCard className="h-5 w-5" />
                  Credit Card Details
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter the credit card information to be securely shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="cardholderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Cardholder Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Card Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            if (formatted.replace(/\s/g, "").length <= 16) {
                              field.onChange(formatted);
                            }
                          }}
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring font-mono"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Expiry Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MM/YY"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatExpiryDate(
                                e.target.value
                              );
                              if (formatted.length <= 5) {
                                field.onChange(formatted);
                              }
                            }}
                            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring font-mono"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">CVV</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              if (value.length <= 4) {
                                field.onChange(value);
                              }
                            }}
                            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring font-mono"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="bg-border" />

                <div className="flex gap-4 items-end">
                  <div className="flex gap-2 w-1/3">
                    <FormField
                      control={form.control}
                      name="reads"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-foreground flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            READS
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  The number of reads determines how often the
                                  data can be shared, before it deletes itself.
                                  0 means unlimited.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-input border-border w-full text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="999">Unlimited</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ttl"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            TTL
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  You can add a TTL (time to live) to the data,
                                  to automatically delete it after a certain
                                  amount of time. 0 means no TTL.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-input w-full border-border text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="1">1 Hour</SelectItem>
                              <SelectItem value="24">1 Day</SelectItem>
                              <SelectItem value="168">7 Days</SelectItem>
                              <SelectItem value="720">30 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 text-lg font-medium w-2/3"
                    size="lg"
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    Encrypt and Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>

        {Object.keys(form.formState.errors).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(form.formState.errors).map(([key, error]) => (
              <div key={key} className="text-destructive text-sm">
                {error?.message}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-sm text-muted-foreground max-w-xl mx-auto">
          <div>
            <strong className="text-foreground">Security:</strong> Clicking
            Share will generate a new symmetrical key and encrypt your data
            before sending only the encrypted data to the server.
          </div>
        </div>
      </div>
    </div>
  );
}
