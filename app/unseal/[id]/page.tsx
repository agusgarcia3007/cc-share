"use client";

import { useState, useEffect } from "react";
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

export default function UnsealPage({ params }: { params: { id: string } }) {
  const [compositeKey, setCompositeKey] = useState("");
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingReads, setRemainingReads] = useState<number | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        setCompositeKey(hash);
        handleDecrypt(hash);
      }
    }
  }, []);

  const handleDecrypt = async (key?: string) => {
    const keyToUse = key || compositeKey;

    try {
      setError("");
      setCardData(null);
      setLoading(true);

      if (!keyToUse) {
        throw new Error("No composite key provided");
      }

      const { id, encryptionKey } = decodeCompositeKey(keyToUse);

      if (id !== params.id) {
        throw new Error("ID mismatch");
      }

      const response = await fetch(`/api/load?id=${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to load data");
      }

      const {
        encrypted,
        iv,
        remainingReads: remaining,
      } = await response.json();
      setRemainingReads(remaining);

      const decryptedText = await decrypt(encrypted, encryptionKey, iv);
      const data = JSON.parse(decryptedText) as CardData;
      setCardData(data);
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    setTimeout(() => {
      setCopied({ ...copied, [field]: false });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Decrypt Credit Card
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter the encryption key to view the shared credit card details
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          </div>
        )}

        {cardData ? (
          <div className="space-y-6">
            {remainingReads !== null && (
              <div className="text-center p-4 bg-muted rounded-lg">
                {remainingReads > 0 ? (
                  <p className="text-sm">
                    This card can be viewed <strong>{remainingReads}</strong>{" "}
                    more times.
                  </p>
                ) : (
                  <p className="text-sm text-destructive">
                    This was the last time this card could be viewed. It has
                    been deleted.
                  </p>
                )}
              </div>
            )}

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credit Card Details
                </CardTitle>
                <CardDescription>
                  Securely decrypted credit card information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
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
                        copyToClipboard(cardData.cardholderName, "name")
                      }
                    >
                      {copied.name ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
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
                          "number"
                        )
                      }
                    >
                      {copied.number ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
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
                          copyToClipboard(cardData.expiryDate, "expiry")
                        }
                      >
                        {copied.expiry ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
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
                        onClick={() => copyToClipboard(cardData.cvv, "cvv")}
                      >
                        {copied.cvv ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-center">
                  <Link href="/">
                    <Button variant="outline">Share Another Card</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enter Encryption Key
              </CardTitle>
              <CardDescription>
                Provide the encryption key to decrypt the credit card data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Encryption Key</Label>
                <Input
                  id="key"
                  value={compositeKey}
                  onChange={(e) => setCompositeKey(e.target.value)}
                  placeholder="Enter the encryption key from the shared link"
                  className="font-mono"
                />
              </div>

              <Button
                onClick={() => handleDecrypt()}
                disabled={loading || !compositeKey}
                className="w-full"
              >
                {loading ? "Decrypting..." : "Decrypt Card"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-sm text-muted-foreground text-center">
          <p>
            <strong>Security:</strong> Data is decrypted locally in your
            browser. The server never sees your unencrypted information.
          </p>
        </div>
      </div>
    </div>
  );
}
