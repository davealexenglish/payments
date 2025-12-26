# Stripe Sandbox Test Cards

## Basic Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Succeeds and immediately processes the payment |
| `4000 0025 0000 3155` | Requires 3D Secure 2 authentication |
| `4000 0000 0000 9995` | Declined - insufficient funds |
| `4000 0000 0000 0002` | Declined - generic decline |

## Card Details

For all test cards:
- **Expiration**: Any future date (e.g., `12/26`)
- **CVV**: Any 3 digits (e.g., `123`)
- **ZIP**: Any valid ZIP code (e.g., `12345`)

## Additional Test Cards

| Card Number | Description |
|-------------|-------------|
| `4000 0000 0000 0341` | Attaching card to customer fails |
| `4000 0000 0000 0069` | Declined - expired card |
| `4000 0000 0000 0127` | Declined - incorrect CVC |
| `4000 0000 0000 0119` | Declined - processing error |

## Reference

Full list: https://docs.stripe.com/testing#cards
