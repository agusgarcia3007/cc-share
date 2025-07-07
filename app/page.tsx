"use client";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { formatCardNumber, formatExpiryDate, getCardType } from "@/lib/utils";
import { encrypt, exportKey, toBase58 } from "@/lib/encryption";
import { encodeCompositeKey, LATEST_KEY_VERSION } from "@/lib/encoding";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  CreditCard,
  Eye,
  HelpCircle,
  Shield,
  Copy,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { useStoreCard } from "@/services/cards/mutation";

const formSchema = z.object({
  cardholderName: z
    .string()
    .min(2, "El nombre del titular debe tener al menos 2 caracteres"),
  cardNumber: z
    .string()
    .min(19, "Número de tarjeta debe tener 16 dígitos")
    .max(19, "Número de tarjeta debe tener 16 dígitos")
    .refine((val) => {
      const digits = val.replace(/\s/g, "");
      return /^\d{16}$/.test(digits);
    }, "El número de tarjeta debe contener solo dígitos"),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, "Formato debe ser MM/YY")
    .refine((val) => {
      const [month, year] = val.split("/");
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      const expMonth = parseInt(month, 10);
      const expYear = parseInt(year, 10);

      if (expMonth < 1 || expMonth > 12) {
        return false;
      }

      if (
        expYear < currentYear ||
        (expYear === currentYear && expMonth < currentMonth)
      ) {
        return false;
      }

      return true;
    }, "La tarjeta no puede estar expirada"),
  cvv: z
    .string()
    .min(3, "CVV debe tener al menos 3 dígitos")
    .max(4, "CVV no puede tener más de 4 dígitos")
    .regex(/^\d{3,4}$/, "CVV debe contener solo números"),
  reads: z.string(),
  ttl: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreditCardShare() {
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const { mutate: storeCard, isPending } = useStoreCard();

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

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      setLink("");

      const cardData = {
        cardholderName: data.cardholderName,
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
      };

      const { encrypted, iv, key } = await encrypt(JSON.stringify(cardData));
      const keyBuffer = await exportKey(key);

      storeCard(
        {
          encrypted: toBase58(encrypted),
          iv: toBase58(iv),
          ttl: parseInt(data.ttl),
          reads: data.reads === "999" ? null : parseInt(data.reads),
        },
        {
          onSuccess: (result) => {
            const compositeKey = encodeCompositeKey(
              LATEST_KEY_VERSION,
              result.id,
              keyBuffer
            );

            const url = new URL(window.location.href);
            url.pathname = `/unseal/${result.id}`;
            url.hash = compositeKey;

            setLink(url.toString());
            setCopied(false);

            track("card_encrypted");
          },
          onError: (error) => {
            setError(error.message || "Error al almacenar los datos");
          },
        }
      );
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Encriptar y Compartir
          </h1>
          <p className="text-muted-foreground text-lg">
            Comparte datos de tarjeta de crédito de forma segura con cifrado de
            extremo a extremo
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {link ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Comparte este enlace</h2>
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mb-6">
              <code className="flex-1 text-sm break-all">{link}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  track("share_link_copied");
                }}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              onClick={() => {
                setLink("");
                form.reset();
              }}
              variant="outline"
            >
              Compartir otra tarjeta
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="bg-card border-border">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <CreditCard className="h-5 w-5" />
                    Detalles de la tarjeta
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Ingresa la información de la tarjeta que deseas compartir de
                    forma segura
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="cardholderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Nombre del titular
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan Pérez"
                            {...field}
                            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => {
                      const cardType = getCardType(field.value);
                      return (
                        <FormItem>
                          <FormLabel className="text-foreground flex items-center gap-2">
                            Número de tarjeta
                            {cardType && (
                              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                {cardType}
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="1234 5678 9012 3456"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatCardNumber(
                                  e.target.value
                                );
                                if (formatted.replace(/\s/g, "").length <= 16) {
                                  field.onChange(formatted);
                                }
                              }}
                              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">
                            Fecha de expiración
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="MM/AA"
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
                          <FormMessage />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-border" />

                  <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                    <div className="flex gap-2 w-full sm:w-1/3">
                      <FormField
                        control={form.control}
                        name="reads"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-foreground flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              VISTAS
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    El número de vistas determina cuántas veces
                                    se puede ver la tarjeta antes de eliminarse.
                                    0 significa ilimitado.
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
                                <SelectItem value="999">Ilimitado</SelectItem>
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
                              TIEMPO DE VIDA
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Puedes agregar un tiempo de vida (TTL) para
                                    eliminar la tarjeta automáticamente después
                                    de cierto tiempo. 0 significa sin límite.
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
                                <SelectItem value="1">1 Hora</SelectItem>
                                <SelectItem value="24">1 Día</SelectItem>
                                <SelectItem value="168">7 Días</SelectItem>
                                <SelectItem value="720">30 Días</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 text-lg font-medium w-full sm:w-2/3"
                      size="lg"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      {isPending ? "Encriptando..." : "Encriptar y Compartir"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        )}

        <div className="mt-8 text-sm text-muted-foreground max-w-xl mx-auto">
          <div>
            <strong className="text-foreground">Seguridad:</strong> Al hacer
            clic en Compartir se genera una nueva clave simétrica y se encriptan
            tus datos antes de enviar solo la información cifrada al servidor.
          </div>
        </div>
      </div>
    </div>
  );
}
