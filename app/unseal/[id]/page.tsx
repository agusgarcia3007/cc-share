"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useLoadCard } from "@/services/cards/query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { decrypt } from "@/lib/encryption";
import { decodeCompositeKey } from "@/lib/encoding";
import { Copy, Check, CreditCard, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface CardData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export default function UnsealPage() {
  const params = useParams();
  const [compositeKey, setCompositeKey] = useState("");
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [error, setError] = useState("");
  const [remainingReads, setRemainingReads] = useState<number | null>(null);
  const [isKeyFromUrl, setIsKeyFromUrl] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const id = params.id as string;
  const {
    data: encryptedData,
    isLoading,
    isError,
    error: queryError,
  } = useLoadCard(id);

  const handleDecrypt = useCallback(
    async (key?: string) => {
      const keyToUse = key || compositeKey;
      try {
        setError("");
        setCardData(null);

        if (!keyToUse) {
          throw new Error("Por favor ingresa una clave de cifrado");
        }

        if (!encryptedData) {
          throw new Error("No se pudo cargar el dato");
        }

        let decoded;
        try {
          decoded = decodeCompositeKey(keyToUse);
        } catch {
          throw new Error("Formato de clave de cifrado inválido");
        }

        const { id: keyId, encryptionKey } = decoded;
        if (keyId !== id) {
          throw new Error("La clave de cifrado no corresponde a este secreto");
        }

        setRemainingReads(encryptedData.remainingReads);

        let decryptedText;
        try {
          decryptedText = await decrypt(
            encryptedData.encrypted,
            encryptionKey,
            encryptedData.iv
          );
        } catch {
          throw new Error(
            "No se pudo descifrar la información. Es posible que la clave de cifrado sea incorrecta."
          );
        }

        let data;
        try {
          data = JSON.parse(decryptedText) as CardData;
        } catch {
          throw new Error("Formato de datos inválido");
        }

        setCardData(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setInitializing(false);
      }
    },
    [compositeKey, id, encryptedData]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        setCompositeKey(hash);
        setIsKeyFromUrl(true);
        if (encryptedData) {
          handleDecrypt(hash);
        }
      } else {
        setInitializing(false);
      }
    }
  }, [handleDecrypt, encryptedData]);

  useEffect(() => {
    if (isError && queryError) {
      setError((queryError as Error).message || "No se pudo cargar el dato");
      setInitializing(false);
    }
  }, [isError, queryError]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${field} copiado al portapapeles`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Desencriptar tarjeta de crédito
          </h1>
          <p className="text-muted-foreground text-lg">
            Ingresa la clave de cifrado para ver los datos compartidos de la
            tarjeta
          </p>
        </div>

        {initializing && (
          <div className="mb-6 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Cargando clave de cifrado...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-destructive font-medium text-sm mb-1">
                  Error
                </p>
                <p className="text-destructive text-sm">{error}</p>
                {error.includes("expirado") && (
                  <p className="text-destructive/80 text-xs mt-2">
                    El secreto alcanzó su límite de vistas o expiró su tiempo de
                    vida.
                  </p>
                )}
                {error.includes("clave de cifrado") && !isKeyFromUrl && (
                  <p className="text-destructive/80 text-xs mt-2">
                    Asegúrate de usar la clave completa del enlace compartido.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!initializing && cardData ? (
          <div className="space-y-6">
            {remainingReads !== null && (
              <div className="text-center p-4 bg-muted rounded-lg">
                {remainingReads > 0 ? (
                  <p className="text-sm">
                    Esta tarjeta puede verse <strong>{remainingReads}</strong>{" "}
                    vez/veces más.
                  </p>
                ) : (
                  <p className="text-sm text-destructive">
                    Esta fue la última vez que se pudo ver esta tarjeta. El
                    secreto ha sido eliminado.
                  </p>
                )}
              </div>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Detalles de la tarjeta
                </CardTitle>
                <CardDescription>
                  Información de la tarjeta desencriptada de forma segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Nombre del titular</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cardholderName"
                      value={cardData.cardholderName}
                      readOnly
                      className="bg-muted font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(cardData.cardholderName, "Nombre")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número de tarjeta</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cardNumber"
                      value={cardData.cardNumber}
                      readOnly
                      className="bg-muted font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          cardData.cardNumber.replace(/\s/g, ""),
                          "Número de tarjeta"
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Fecha de expiración</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="expiryDate"
                        value={cardData.expiryDate}
                        readOnly
                        className="bg-muted font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            cardData.expiryDate,
                            "Fecha de expiración"
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cvv"
                        value={cardData.cvv}
                        readOnly
                        className="bg-muted font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(cardData.cvv, "CVV")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-center">
                  <Link href="/">
                    <Button variant="outline">Compartir otra tarjeta</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !initializing ? (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ingresar clave de cifrado
              </CardTitle>
              <CardDescription>
                {isKeyFromUrl
                  ? "La clave de cifrado fue detectada desde el enlace. Haz clic en desencriptar para ver la tarjeta."
                  : "Ingresa la clave de cifrado para desencriptar los datos de la tarjeta"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Clave de cifrado</Label>
                <Input
                  id="key"
                  value={compositeKey}
                  onChange={(e) => {
                    setCompositeKey(e.target.value);
                    setIsKeyFromUrl(false);
                  }}
                  placeholder="Ingresa la clave de cifrado del enlace compartido"
                  className="font-mono"
                />
              </div>

              <Button
                onClick={() => handleDecrypt()}
                disabled={isLoading || !compositeKey}
                className="w-full"
              >
                {isLoading ? "Desencriptando..." : "Desencriptar tarjeta"}
              </Button>

              {!isKeyFromUrl && (
                <div className="text-xs text-muted-foreground">
                  <p>
                    La clave de cifrado debería cargarse automáticamente desde
                    el enlace. Si la ingresas manualmente, asegúrate de copiar
                    la clave completa.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-8 text-sm text-muted-foreground text-center">
          <p>
            <strong>Seguridad:</strong> Los datos se desencriptan localmente en
            tu navegador. El servidor nunca ve tu información sin cifrar.
          </p>
        </div>
      </div>
    </div>
  );
}
