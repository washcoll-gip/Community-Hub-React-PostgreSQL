first_value = 20
last_value = 1
decrement_x = 79 / 44  # ≈ 1.79545

percentages = {}
percentages[1] = first_value
percentages[10] = last_value

# Calculate deciles 2 to 9
for i in range(2, 10):
    coefficient = 11 - i  # From 9 down to 2
    percentages[i] = coefficient * decrement_x

# Display results and total sum
total = 0
for i in range(1, 11):
    val = percentages.get(i, 0)
    total += val
    print(f"Decile {i}: {val:.4f}%")

print(f"Total sum: {total:.4f}%")